import { LitElement, html, css } from 'lit-element';
import { EntityMixinLit } from 'siren-sdk/src/mixin/entity-mixin-lit';
import { LocalizeMixin } from '../LocalizeMixin';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/tooltip/tooltip.js';
import 'd2l-table/d2l-table.js';
import { OutcomeActivityCollectionEntity } from '../entities/OutcomeActivityCollectionEntity';

const publishStatusImages = {
	published: '../../images/infAssessmentPublished.png',
	notPublished: '../../images/infAssessmentNotPublished.png'
};

export class GradebookUserOutcome extends LocalizeMixin(EntityMixinLit(LitElement)) {
	static get is() { return 'd2l-coa-gradebook-user-outcome'; }

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

			#assessment-fraction-container {
				line-height: 12px;
			}

			#assessment-fraction {
				display: inline-block;
				padding-left: 6px;
				padding-top: 6px;
				padding-right: 6px;
				font-family: 'Lato', sans-serif;
				font-size: 12px;
				color: var(--d2l-color-tungsten)
			}

			.assessment-level-label {
				@apply --d2l-body-compact-text;
				display: inline-block;
				line-height: 24px;
				padding-left: 30px;
				padding-bottom: 18px;
			}

			:host([dir="rtl"]) .assessment-level-label {
				padding-right: 30px;
				padding-left: 0px;

			}
			.override-indicator {
				display: inline-block;
				line-height: 24px;
				padding-bottom: 18px;
				font-family: 'Lato', sans-serif;
				font-size: 20px;
			}

			.assessment-outdated-icon {
				display: inline-block;
				float: right;
				padding-right: 6px;
				padding-top: 3px;
			}

			:host([dir="rtl"]) .assessment-outdated-icon {
				float: left;
				padding-left: 6px;
				padding-right: 0px;
			}

			.assessment-publish-status-img {
				display: inline-block;
				float: right;
				padding-right: 9px;
				padding-top: 4px;
			}

			:host([dir="rtl"]) .assessment-publish-status-img {
				float: left;
				padding-left: 9px;
				padding-right: 0px;
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

		<div class="cell-content-container" tabindex="0" style="background-color:${data.levelColor}">
			<div id="assessment-fraction-container">
				<span id="assessment-fraction">
					${data.totalEvaluatedAssessments}/${data.totalAssessments}
				</span>
			</div>
			<div class="assessment-level-label">${data.levelName}</div>
			${data.isManualOverride ? html`
				<div class="override-indicator"><b>*</b></div>
			` : null}

			<img
				class="assessment-publish-status-img"
				src="${data.published ? publishStatusImages.published : publishStatusImages.notPublished}"
			/>
			${data.outdated ? html`
				<d2l-icon class="assessment-outdated-icon" icon="tier1:refresh"></d2l-icon>
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

	_getTooltipText(totalActivities, totalAssessed) {
		return this.localize('tooltipUserOutcomeAssessments', 'numAssessed', totalAssessed, 'numTotal', totalActivities);
	}

	_onEntityChanged(entity) {
		if (!entity) {
			return;
		}
		let name, color, hasOverallDemonstration, overallAssessmentDate, mostRecentAssessmentDate, hasManualOverride, isPublished, isOutOfDate;
		let assessmentCount = 0;
		let assessmentWithDemonstrationCount = 0;
		entity.onActivityChanged(activity => {
			if (!activity) {
				return;
			}
			//Check if the activity is a checkpoint item, then fill in appropriate information
			if (activity.isOverallAchievement()) {
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
			}
			this._cellData = {
				totalAssessments: assessmentCount,
				totalEvaluatedAssessments: assessmentWithDemonstrationCount,
				levelName: name,
				levelColor: color + '1A',
				isManualOverride: hasManualOverride,
				outdated: isOutOfDate,
				published: isPublished
			};
		});
	}
}

customElements.define(GradebookUserOutcome.is, GradebookUserOutcome);
