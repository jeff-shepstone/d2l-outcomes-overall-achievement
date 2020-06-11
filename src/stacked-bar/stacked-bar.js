import { LitElement, html, css } from 'lit-element';
import { EntityMixinLit } from 'siren-sdk/src/mixin/entity-mixin-lit';
import { OutcomeActivityCollectionEntity } from '../entities/OutcomeActivityCollectionEntity';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/tooltip/tooltip.js';

class StackedBar extends EntityMixinLit(LitElement) {
	static get is() { return 'd2l-coa-stacked-bar'; }

	static get properties() {
		return {
			compact: { type: Boolean },
			_histData: { type: Array },
			_totalCount: { type: Number }
		};
	}

	static get styles() {
		return [
			css`
				#graph-container {
					align-items: stretch;
					display: flex;
					height: 18px;
				}

				.compact #graph-container {
					height: 30px;
				}

				.graph-bar {
					margin-right: 2px;
				}

				.graph-bar:first-child {
					border-radius: 4px 0px 0px 4px;
				}

				.graph-bar:last-child {
					border-radius: 0px 4px 4px 0px;
					margin-right: 0px;
				}

				.compact #graph-container .graph-bar {
					border-radius: 0px;
				}

				#summary {
					display: none;
					margin: 12px 0px 30px 0px;
					padding: 0px;
				}

				#summary li {
					border-top: 1px solid var(--d2l-color-gypsum);
					display: flex;
					justify-content: space-between;
					padding: 9px 12px;
				}

				#summary li:last-child {
					border-bottom: 1px solid var(--d2l-color-gypsum);
				}

				@media (pointer: fine) {
					#graph-container:focus,
					#graph-container:hover {
						filter: brightness(120%);
						outline: none;
					}
					
					#container:not(.compact) #graph-container:focus .graph-bar,
					#container:not(.compact) #graph-container:hover .graph-bar {
						animation: raise 200ms ease-in;
						box-shadow: 0px 2px 10px 0px rgba(0, 0, 0, 0.1);
						position: relative;
						top: -2px;
					}
				}

				@media (pointer: coarse) {
					#summary {
						display: block;
					}
				}

				@keyframes raise {
					0% {
						box-shadow: 0px 2px 10px 0px rgba(0, 0, 0, 0);
						top: 0px;
					}

					100% {
						box-shadow: 0px 2px 10px 0px rgba(0, 0, 0, 0.1);
						top: -2px;
					}
				}

				[hidden] {
					display: none !important;
				}
			`
		];
	}

	constructor() {
		super();
		this._setEntityType(OutcomeActivityCollectionEntity);

		this.compact = this.compact || false;
		this._histData = [];
		this._totalCount = 0;
	}

	render() {
		return html`
			<div id="container" class="${this._getContainerClass(this.compact)}">
				<div id="graph-container" tabindex="0" aria-labelledby="tooltip">
					${this._histData.map(this._renderBar.bind(this))}
				</div>
				<d2l-tooltip id="tooltip" for="graph-container">
					${this._histData.map(this._renderTooltipLine.bind(this))}
				</d2l-tooltip>
				<ul id="summary" ?hidden="${this.compact}" aria-hidden="true">
					${this._histData.map(this._renderSummaryLine.bind(this))}
				</ul>
			</div>
        `;
	}

	_buildHistData(levels, demonstrations) {
		levels.sort((left, right) => {
			return left.getSortOrder() - right.getSortOrder();
		});

		const levelMap = levels.reduce((acc, level) => {
			acc[level.getLevelId()] = {
				color: level.getColor(),
				count: 0,
				name: level.getName()
			};
			return acc;
		}, {});

		demonstrations.forEach(demonstratedLevel => {
			if (levelMap[demonstratedLevel]) {
				levelMap[demonstratedLevel].count++;
			}
		});

		this._histData = Object.values(levelMap);
		this._totalCount = demonstrations.length;
	}

	set _entity(entity) {
		if (this._entityHasChanged(entity)) {
			this._onEntityChanged(entity);
			super._entity = entity;
		}
	}

	_getContainerClass(compact) {
		const classes = [];

		if (compact) {
			classes.push('compact');
		}

		return classes.join(' ');
	}

	_getLevelCountText(levelData) {
		const percentage = Math.floor(100.0 * levelData.count / (this._totalCount || 1));
		return `${levelData.count} (${percentage}%)`;
	}

	_onEntityChanged(entity) {
		if (entity) {
			const demonstrations = [];
			entity.onActivityChanged(activity => {
				activity.onAssessedDemonstrationChanged(demonstration => {
					const demonstratedLevel = demonstration.getDemonstratedLevel();
					demonstrations.push(demonstratedLevel.getLevelId());
				});
			});

			const levels = [];
			entity.onDefaultScaleChanged(scale => {
				scale.onLevelChanged(level => levels.push(level));
			});

			entity.subEntitiesLoaded().then(() => {
				this._buildHistData(levels, demonstrations);
			});
		}
	}

	_renderBar(levelData) {
		if (!levelData || !levelData.count) {
			return null;
		}

		return html`
			<div
				class="graph-bar" 
				style="background: ${levelData.color}; flex-grow: ${levelData.count};"
			></div>
		`;
	}

	_renderSummaryLine(levelData) {
		return html`
			<li>
				<span>${levelData.name}:</span>
				<span>${this._getLevelCountText(levelData)}</span>
			</li>
		`;
	}

	_renderTooltipLine(levelData) {
		return html`
			<div>${levelData.name}: ${this._getLevelCountText(levelData)}</div>
		`;
	}
}

customElements.define(StackedBar.is, StackedBar);
