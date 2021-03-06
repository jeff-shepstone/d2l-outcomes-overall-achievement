import { LitElement, html, css } from 'lit-element';
import { EntityMixinLit } from 'siren-sdk/src/mixin/entity-mixin-lit';
import { LocalizeMixin } from '../LocalizeMixin';
import { SkeletonMixin } from '@brightspace-ui/core/components/skeleton/skeleton-mixin.js';
import { OutcomeActivityCollectionEntity } from '../entities/OutcomeActivityCollectionEntity';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/tooltip/tooltip.js';

const unassessedColor = '#9ea5a9';

export class StackedBar extends SkeletonMixin(LocalizeMixin(EntityMixinLit(LitElement))) {
	static get is() { return 'd2l-coa-stacked-bar'; }

	static get properties() {
		return {
			compact: { type: Boolean },
			excludedTypes: { attribute: 'excluded-types', type: Array },
			displayUnassessed: { attribute: 'display-unassessed', type: Boolean },
			_histData: { attribute: false },
			_assessedCount: { attribute: false },
			_totalCount: { attribute: false },
		};
	}

	static get styles() {
		return [
			super.styles,
			css`
				#container {
					position: relative;
				}

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

				:host([dir="rtl"]) .graph-bar {
					margin-right: 0px;
					margin-left: 2px;
				}

				.graph-bar:first-child {
					border-radius: 4px 0px 0px 4px;
				}

				:host([dir="rtl"]) .graph-bar:first-child {
					border-radius: 0px 4px 4px 0px;
				}

				.graph-bar:last-child {
					border-radius: 0px 4px 4px 0px;
					margin-right: 0px;
				}

				:host([dir="rtl"]) .graph-bar:last-child {
					border-radius: 4px 0px 0px 4px;
				}

				.graph-bar-skeleton {
					border-radius: 4px 4px 4px 4px;
					flex-grow: 1;
				}

				.compact #graph-container .graph-bar {
					border-radius: 0px;
				}

				.empty-bar {
					background: var(--d2l-color-mica);
					flex-grow: 1;
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

				#summary li .count {
					flex-shrink: 0;
					margin-left: 8px;
				}

				@media (pointer: fine) {
					:host(:not([skeleton])) #graph-container:focus,
					:host(:not([skeleton])) #graph-container:hover {
						filter: brightness(120%);
						outline: none;
					}
					
					#container:not(.compact) #graph-container:focus .graph-bar,
					#container:not(.compact) #graph-container:hover .graph-bar {
						animation: raise 200ms ease-in;
						box-shadow: 0px 2px 10px 0px rgba(0, 0, 0, 0.1);
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
		this.excludedTypes = this.excludedTypes || [];
		this._histData = [];
		this._totalCount = 0;
		this._assessedCount = 0;
		this.skeleton = true;
	}

	render() {
		return html`
			<div id="container" class="${this._getContainerClass(this.compact)}">
				<div id="graph-container" tabindex="0" aria-labelledby="tooltip">
					${this._renderGraph()}
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
		for (const href in demonstrations) {
			const demonstratedLevel = demonstrations[href];
			if (levelMap[demonstratedLevel]) {
				levelMap[demonstratedLevel].count++;
			}
		}

		this._histData = Object.values(levelMap);
		if (this.displayUnassessed) {
			const unassessedData = {
				color: unassessedColor,
				count: this._totalCount - this._assessedCount,
				name: this.localize('notEvaluated')
			};
			this._histData.push(unassessedData);
		}
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
		const displayCount = (this.displayUnassessed ? this._totalCount : this._assessedCount);
		const percentage = Math.floor(100.0 * levelData.count / (displayCount || 1));
		return `${levelData.count} (${percentage}%)`;
	}

	_onEntityChanged(entity) {
		if (entity) {
			const demonstrations = {};
			entity.onActivityChanged(activity => {
				const activityType = activity.getType();
				if (activityType && this.excludedTypes.includes(activityType)) {
					return;
				}
				activity.onAssessedDemonstrationChanged(demonstration => {
					const demonstrationHref = demonstration.getSelfHref();
					const demonstratedLevel = demonstration.getDemonstratedLevel();
					const levelId = demonstratedLevel.getLevelId();
					if (levelId && demonstrationHref) {
						demonstrations[demonstrationHref] = levelId;
					}
				});
			});

			const levels = [];
			entity.onDefaultScaleChanged(scale => {
				scale.onLevelChanged(level => levels.push(level));
			});

			entity.subEntitiesLoaded().then(() => {
				this._assessedCount = Object.keys(demonstrations).length;
				this._totalCount = entity.getOutcomeActivities().length;
				this._buildHistData(levels, demonstrations);
				this.skeleton = false;
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

	_renderGraph() {
		if (this.skeleton) {
			return html`
				<div class="graph-bar-skeleton d2l-skeletize" />
			`;
		}

		if (this._totalCount === 0) {
			return html`
				<div
					class="graph-bar"
					style="background: var(--d2l-color-mica); flex-grow: 1;"
				></div>
		`;
		}

		return this._histData.map(this._renderBar.bind(this));
	}

	_renderSummaryLine(levelData) {
		return html`
			<li>
				<span>${levelData.name}:</span>
				<span class="count">${this._getLevelCountText(levelData)}</span>
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
