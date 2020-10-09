import { LitElement, html, css } from 'lit-element';
import { EntityMixinLit } from 'siren-sdk/src/mixin/entity-mixin-lit';
import { LocalizeMixin } from '../LocalizeMixin';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/tooltip/tooltip.js';
import 'd2l-table/d2l-table.js';
import { OutcomeActivityCollectionEntity } from '../entities/OutcomeActivityCollectionEntity';
import '../custom-icons/visibility-hide.js';
import '../custom-icons/visibility-show.js';

const KEYCODES = {
	ENTER: 13,
	SPACE: 32
};

export class MasteryViewUserOutcomeCell extends LocalizeMixin(EntityMixinLit(LitElement)) {
	static get is() { return 'd2l-mastery-view-user-outcome-cell'; }

	static get properties() {
		return {
			_cellData: Object
		};
	}

	static get styles() {
		return css`
			.cell-content-container:focus {
				outline-color: var(--d2l-color-celestine);
			}

			.cell-content-container {
				width: 9.9rem;
			}

			#assessment-fraction-container {
				line-height: 0.6rem;
			}

			#assessment-fraction {
				display: inline-block;
				padding-left: 0.3rem;
				padding-top: 0.3rem;
				padding-right: 0.3rem;
				font-family: 'Lato', sans-serif;
				font-size: 0.6rem;
				color: var(--d2l-color-tungsten)
			}

			.assessment-label-container {
				display: inline-block;
				padding-left: 1.5rem;
				padding-bottom: 0.9rem;
			}

			:host([dir="rtl"]) .assessment-label-container {
				padding-right: 1.5rem;
				padding-left: 0;
			}

			.assessment-level-label {
				@apply --d2l-body-compact-text;
				float: left;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				max-width: 5rem;
				line-height: 1.2rem;
			}

			:host([dir="rtl"]) .assessment-level-label {
				float: right;
			}

			.cell-content-container:hover .assessment-level-label {
				text-decoration: underline;
			}

			:host([dir="rtl"]) .override-indicator {
				float: right;
			}

			.assessment-outdated-icon {
				display: inline-block;
				float: right;
				padding-right: 0.3rem;
				padding-top: 0.15rem;
			}

			:host([dir="rtl"]) .assessment-outdated-icon {
				float: left;
				padding-left: 0.3rem;
				padding-right: 0;
			}

			.assessment-publish-status-icon {
				display: inline-block;
				float: right;
				padding-right: 0.45rem;
				padding-top: 0.3rem;
			}

			:host([dir="rtl"]) .assessment-publish-status-icon {
				float: left;
				padding-left: 0.45rem;
				padding-right: 0;
			}

		`;
	}

	constructor() {
		super();
		this._setEntityType(OutcomeActivityCollectionEntity);
	}

	render() {
		const data = this._cellData;
		if (!data) {
			//TODO: create loading skeleton to render in place of cell content
			return null;
		}
		return html`
		<div
			class="cell-content-container"
			tabindex="0"
			style="background-color:${data.levelColor}"
			@click=${() => { this._onClick(); }}
			@keydown=${(e) => { this._onKeyDown(e); }}
			aria-label="${this._getAriaText(data)}"
		>
			<div id="assessment-fraction-container" aria-hidden="true">
				<span id="assessment-fraction">
					${data.totalEvaluatedAssessments}/${data.totalAssessments}
				</span>
			</div>
			<div class="assessment-label-container" aria-hidden="true">
				<div class="assessment-level-label" title="${data.levelName}">
					${data.levelName}
				</div>
				${data.isManualOverride ? html`
					<span class="override-indicator" title="${this.localize('manualOverride')}"><b>*</b></span>
				` : null}
			</div>
			<div
				class="assessment-publish-status-icon"
				aria-hidden="true"
				title="${data.published ? this.localize('published') : this.localize('notPublished')}"
			>
				${data.published ? html`<d2l-icon-visibility-show />` : html`<d2l-icon-visibility-hide />`}
			</div>
			${data.outdated ? html`
				<span aria-hidden="true" title="${this.localize('outOfDate')}">
					<d2l-icon class="assessment-outdated-icon" icon="tier1:refresh" />
				</span>
			` : null}

		</div>
		<d2l-tooltip
			id="tooltip"
			for="assessment-fraction"
			position="top"
			align="start"
		>
			${this._getTooltipText(data.totalAssessments, data.totalEvaluatedAssessments)}
		</d2l-tooltip>
		`;
	}

	set _entity(entity) {
		if (this._entityHasChanged(entity)) {
			this._onEntityChanged(entity);
			super._entity = entity;
		}
	}

	_getAriaText(data) {
		var assessmentInfo = '';
		if (data.hasOverallAssessment) {
			assessmentInfo += data.levelName + this.localize('commaSeparator');
		}
		else {
			assessmentInfo += this.localize('notEvaluated') + this.localize('commaSeparator');
		}

		if (data.isManualOverride) {
			assessmentInfo += this.localize('manualOverride') + this.localize('commaSeparator');
		}

		if (data.outdated) {
			assessmentInfo += this.localize('outOfDate') + this.localize('commaSeparator');
		}

		if (data.published) {
			assessmentInfo += this.localize('published') + this.localize('commaSeparator');
		}
		else {
			assessmentInfo += this.localize('notPublished') + this.localize('commaSeparator');
		}

		assessmentInfo += this.localize('tooltipUserOutcomeAssessments',
			'numAssessed', data.totalEvaluatedAssessments,
			'numTotal', data.totalAssessments);
		
		return this.localize('masteryViewUserOutcomeScreenReaderText',
			'assessmentInfo', assessmentInfo
		);
	}

	_getTooltipText(totalActivities, totalAssessed) {
		return this.localize('tooltipUserOutcomeAssessments', 'numAssessed', totalAssessed, 'numTotal', totalActivities);
	}

	_onClick() {
		const link = this._cellData.evalPageHref;
		if (!link) {
			return;
		}
		window.location = link;
	}

	_onEntityChanged(entity) {
		if (!entity) {
			return;
		}
		let name, color, hasOverallDemonstration, overallAssessmentDate, mostRecentAssessmentDate, hasManualOverride, isPublished, isOutOfDate, evalHref;
		let assessmentCount = 0;
		let assessmentWithDemonstrationCount = 0;
		entity.onActivityChanged(activity => {
			if (!activity) {
				return;
			}
			if (activity.getType() === 'checkpoint-item') {
				//Activity is an overall achievement
				activity.onAssessedDemonstrationChanged(demonstration => {
					hasOverallDemonstration = true;
					const demonstratedLevel = demonstration.getDemonstratedLevel();
					hasManualOverride = demonstratedLevel.isManualOverride();
					overallAssessmentDate = demonstration.getDateAssessed();
					isPublished = demonstration.isPublished();
					demonstratedLevel.onLevelChanged(loa => {
						name = loa.getName();
						color = loa.getColor();
					});
				});
				activity.onUserActivityUsageChanged(activityUsage => {
					evalHref = activityUsage.getEvalPageHref();
				});
			}
			else {
				assessmentCount++;
				activity.onAssessedDemonstrationChanged(demonstration => {
					assessmentWithDemonstrationCount++;
					const assessmentDate = demonstration.getDateAssessed();
					if (!mostRecentAssessmentDate || assessmentDate > mostRecentAssessmentDate) {
						mostRecentAssessmentDate = assessmentDate;
					}
				});
			}
		});

		entity.subEntitiesLoaded().then(() => {
			if (hasOverallDemonstration) {
				isOutOfDate = (mostRecentAssessmentDate && mostRecentAssessmentDate > overallAssessmentDate);
			}
			else {
				name = '-';
				color = '#FFFFFF';
				isPublished = false;
				isOutOfDate = false;
				hasManualOverride = false;
			}
			this._cellData = {
				hasOverallAssessment: hasOverallDemonstration,
				totalAssessments: assessmentCount,
				totalEvaluatedAssessments: assessmentWithDemonstrationCount,
				levelName: name,
				levelColor: color + '1A',
				isManualOverride: hasManualOverride,
				outdated: isOutOfDate,
				published: isPublished,
				evalPageHref: evalHref
			};
		});
	}

	_onKeyDown(event) {
		if (event.keyCode === KEYCODES.ENTER || event.keyCode === KEYCODES.SPACE) {
			this._onClick();
		}
	}
}

customElements.define(MasteryViewUserOutcomeCell.is, MasteryViewUserOutcomeCell);
