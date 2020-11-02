import { LitElement, html, css } from 'lit-element';
import { EntityMixinLit } from 'siren-sdk/src/mixin/entity-mixin-lit';
import { LocalizeMixin } from '../LocalizeMixin';
import { ClassOverallAchievementEntity } from '../entities/ClassOverallAchievementEntity.js';
import './mastery-view-user-outcome-cell.js';
import './mastery-view-outcome-header-cell.js';

import { d2lTableStyles } from '../custom-styles/d2l-table-styles';
import { linkStyles } from '@brightspace-ui/core/components/link/link.js';
import { selectStyles } from '@brightspace-ui/core/components/inputs/input-select-styles.js';
import { bodyCompactStyles } from '@brightspace-ui/core/components/typography/styles';

import '../custom-icons/LeftArrow.js';
import '../custom-icons/RightArrow.js';

import 'd2l-table/d2l-table.js';
import 'd2l-table/d2l-scroll-wrapper.js';
import 'd2l-alert/d2l-alert.js';

import '@brightspace-ui/core/components/typography/typography.js';
import '@brightspace-ui/core/components/button/button-subtle.js';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/inputs/input-checkbox.js';
import '@brightspace-ui/core/components/icons/icon.js';
import '@brightspace-ui/core/components/link/link.js';
import '@brightspace-ui/core/components/tooltip/tooltip.js';

import Images from '../images/images.js';

const DEFAULT_ROW_SIZE = 20;
const PAGE_ROW_SIZES = [10, 20, 30, 50, 100, 200];

class MasteryViewTable extends EntityMixinLit(LocalizeMixin(LitElement)) {
	static get is() { return 'd2l-mastery-view-table'; }

	static get properties() {
		return {
			errorLoggingEndpoint: {
				type: String,
				value: null
			},
			outcomesToolLink: {
				type: String,
				attribute: 'outcomes-tool-link'
			},
			outcomeTerm: {
				type: String,
				attribute: 'outcome-term'
			},
			_learnerList: Array,

			_outcomeHeadersData: Array,
			_learnerRowsData: Array,

			_rowsPerPage: Number,
			_currentPage: Number,
			_pageCount: Number,

			_showFirstNames: Boolean,
			_showLastNames: Boolean,
			_nameFirstLastFormat: Boolean,
			_sortDesc: Boolean,

			_skeletonLoaded: Boolean,

			_hasErrors: Boolean,
			_sessionId: Number
		};
	}

	static get styles() {
		return [
			css`
				#scroll-wrapper {
					--d2l-scroll-wrapper-h-scroll: {
						border-left: 1px dashed var(--d2l-color-mica);
						border-right: 1px dashed var(--d2l-color-mica);
					};

					--d2l-scroll-wrapper-left: {
						border-left: none;
					};

					--d2l-scroll-wrapper-right: {
						border-right: none;
					};

					--d2l-scroll-wrapper-border-color: var(--d2l-color-mica);
					--d2l-scroll-wrapper-background-color: var(--d2l-color-regolith);
				}

				#no-outcomes-container {
					width: 100%;
					display: flex;
					align-items: center;
					flex-direction: column;
				}

				#no-outcomes-container img {
					height: 357px;
					width: 479px;
				}

				#no-outcomes-container div {
					margin-top: 30px;
					text-align: center;
				}

				#no-outcomes-container a {
					text-decoration: none;
				}

				.learner-column-head {
					padding: 0rem 0.8rem;
					min-width: 9.9rem;
					max-width: 25.6rem;
				}

				.outcome-column-head {
					vertical-align: bottom;
					width: 9.9rem;
				}

				.learner-name-cell {
					height: 3rem;
					max-width: 25.6rem;
				}

				.learner-name-container {
					display: flex;
				}

				.learner-name-label {
					padding: 0rem 0.8rem;
					line-height: 3rem;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}

				.learner-name-label:focus {
					outline: 0;
					text-decoration: underline;
				}
				
				.learner-outcome-cell {
					width: 9.9rem;
				}

				#no-learners-cell {
					border-radius: 0;
					border-bottom: 1px solid var(--d2l-table-border-color);
				}

				.no-learners-label {
					padding: 0rem 0.8rem;
					line-height: 3rem;
				}

				#pagination-controls-container {
					margin-top: 0.9rem;
					margin-bottom: 2.1rem;
				}

				#page-label {
					margin-left: 0.35rem;
				}

				:host([dir="rtl"]) #page-label {
					margin-left: 0;
					margin-right: 0.35rem;
				}

				#page-select-menu {
					margin-right: 0.35rem;
				}

				:host([dir="rtl"]) #page-select-menu {
					margin-right: 0;
					margin-left: 0.35rem;
				}

				#page-size-menu {
					margin-left: 1.8rem;
				}

				:host([dir="rtl"]) #page-size-menu {
					margin-left: 0;
					margin-right: 1.2rem;
				}

				.page-label {
					height: 2.1rem;
				}

				.page-select-menu,
				.page-size-menu {
					height: 2.1rem;
				}
			`,
			d2lTableStyles,
			linkStyles,
			selectStyles,
			bodyCompactStyles
		];
	}

	constructor() {
		super();
		this._outcomeHeadersData = [];
		this._learnerRowsData = [];
		this._learnerList = [];
		this._rowsPerPage = DEFAULT_ROW_SIZE;
		this._currentPage = 1;
		this._pageCount = 1;
		this._showFirstNames = false;
		this._showLastNames = false;
		this._nameFirstLastFormat = false;
		this._sortDesc = false;
		this._skeletonLoaded = false;
		this._hasErrors = false;
		this._sessionId = this.getUUID();
		this._setEntityType(ClassOverallAchievementEntity);
	}

	connectedCallback() {
		super.connectedCallback();
		this._handleSirenErrors = this._handleSirenErrors.bind(this);
		window.addEventListener('d2l-siren-entity-error', this._handleSirenErrors);
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		window.removeEventListener('d2l-siren-entity-error', this._handleSirenErrors);
	}

	getUUID() {
		return Math.random().toString(36).substring(2) + Date.now().toString(36);
	}

	render() {
		if (!this._skeletonLoaded) {
			//Basic table outline (classlist, aligned outcomes) still loading - hold off on rendering
			return null;
		}

		if (this._hasErrors) {
			return html`
			<d2l-alert type="error">
				${this.localize('masteryViewTableEmptyError')}
			</d2l-alert>
			`;
		}

		if (this._outcomeHeadersData.length === 0) {
			//TODO: render empty state for no aligned outcomes, OR propagate an event
			return html`
			<div id="no-outcomes-container" class="d2l-typography">
				<img src=${Images['blueprint']} />
				<div class="d2l-body-compact">
					${this.localize('noAlignedOutcomes', 'outcome', this.outcomeTerm)}
				</div>
				<div class="d2l-body-compact">
					<a href=${this.outcomesToolLink}>${this.localize('viewCourseIntentList', 'outcome', this.outcomeTerm)}</a>
				</div>
			</div>
			`
		}

		return html`
		<d2l-scroll-wrapper id="scroll-wrapper" show-actions>
		<d2l-table-wrapper sticky-headers show-actions type="default">
			<table
				class="d2l-table"
				role="grid"
				aria-label="${this.localize('masteryViewTableDescription')}"
			>
				<thead>
					${this._renderTableHead(this._overallOutcomesData)}
				</thead>
				<tbody>
					${this._renderTableBody(this._learnerRowsData)}
				<tbody>
			</table>
		</d2l-table-wrapper>
		</d2l-scroll-wrapper>
		${this._renderTableControls()}
		`;
	}

	set _entity(entity) {
		if (this._entityHasChanged(entity)) {
			this._onEntityChanged(entity);
			super._entity = entity;
		}
	}

	_getLearnerHeadAriaLabel(isLastName, isSecondButton) {
		const newSortKey = isLastName ? this.localize('lastName') : this.localize('firstName');

		let currentSortKey, newSortDirection;
		if (isSecondButton) {
			newSortDirection = this.localize('ascending');
			currentSortKey = isLastName ? this.localize('firstName') : this.localize('lastName');
		}
		else {
			newSortDirection = this._sortDesc ? this.localize('ascending') : this.localize('descending');
			currentSortKey = newSortKey;
		}

		const currentSortDirection = this._sortDesc ? this.localize('descending') : this.localize('ascending');

		return this.localize(
			'learnerSortButtonDescription',
			'newSortKey', newSortKey,
			'newSortDirection', newSortDirection,
			'currentSortKey', currentSortKey,
			'currentSortDirection', currentSortDirection
		);
	}

	_getLearnerRowsData(learnerInfoList, currentPage, rowsPerPage) {
		const firstRowIdx = (currentPage - 1) * rowsPerPage;
		const lastRowIdx = firstRowIdx + (rowsPerPage - 1);
		const list = learnerInfoList.slice(firstRowIdx, lastRowIdx + 1);
		return list;
	}

	_getPageNumberDropdownText() {
		return this.localize('pageNumberDropdownText',
			'currentPage', this._currentPage,
			'pageCount', this._pageCount
		);
	}

	_getPageSizeDropdownEntryText(rowsPerPage) {
		return this.localize('pageSizeDropdownText',
			'rowsPerPage', rowsPerPage
		);
	}

	_getUserNameDisplay(firstName, lastName) {
		let displayString;

		if (!firstName && !lastName) {
			displayString = this.localize('anonymousUser');
		}
		else if (!firstName) {
			displayString = lastName;
		}
		else if (!lastName) {
			displayString = firstName;
		}
		else if (this._nameFirstLastFormat) {
			return firstName + ' ' + lastName;
		}
		else {
			return lastName + ', ' + firstName;
		}

		return displayString;
	}

	_goToPageNumber(newPage) {
		this._currentPage = newPage;
		var selector = this.shadowRoot.getElementById('page-select-menu');
		selector.selectedIndex = newPage - 1;
		this._learnerRowsData = this._getLearnerRowsData(this._learnerList, this._currentPage, this._rowsPerPage);
	}

	_handleSirenErrors(e) {
		if (e && e['target'] && e.target.href === this.href) {
			this._hasErrors = true;
			const errorInfo = {
				RequestUrl: this.href,
				RequestMethod: 'GET',
				ResponseStatus: (e.detail && typeof e.detail['error'] === 'number') ? e.detail.error : null
			};
			const errorObject = {
				Type: 'ApiError',
				SessionId: this._sessionId,
				Location: window.location.pathname,
				Referrer: document.referrer || null,
				Error: errorInfo
			};
			window.fetch(
				this.errorLoggingEndpoint, {
					method: 'POST',
					mode: 'no-cors',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify([errorObject])
				}
			);
		}
	}

	_onEntityChanged(entity) {
		if (!entity) {
			return;
		}

		const learnerInfoList = [];
		const outcomeHeadersData = [];
		const outcomeClassProgressEntities = entity.getOutcomeClassProgressItems();
		outcomeClassProgressEntities.map(outcomeProgressEntity => {

			const activityCollectionHref = outcomeProgressEntity.getOutcomeActivityCollectionHref();
			outcomeProgressEntity.onOutcomeChanged(outcome => {
				if (!outcome) {
					return;
				}

				const outcomeData = {
					href: outcome.getSelfHref(),
					activityCollectionHref: activityCollectionHref,
					name: outcome.getNotation(),
					description: outcome.getDescription()
				};
				outcomeHeadersData.push(outcomeData);
			});
		});

		entity.onClasslistChanged(classlist => {
			if (!classlist) {
				return;
			}

			const coaUserEntities = classlist.getUsers();
			let showFirstNames = false;
			let showLastNames = false;
			//Resolve all user links to get first and last names, plus links to data
			coaUserEntities.map(coaUser => {
				if (!coaUser) {
					return;
				}

				const firstName = coaUser.getFirstName();
				const lastName = coaUser.getLastName();
				if (firstName) {
					showFirstNames = true;
				}
				if (lastName) {
					showLastNames = true;
				}

				const userOutcomeDataLinks = [];

				coaUser.onUserProgressOutcomesChanged(upoc => {
					if (upoc) {
						const upoEntities = upoc.getUserProgressOutcomes();
						upoEntities.map(upo => {
							const userOutcomeData = {
								outcomeHref: upo.getOutcomeHref(),
								activityCollectionHref: upo.getOutcomeActivitiesHref()
							};
							userOutcomeDataLinks.push(userOutcomeData);
						});
						userOutcomeDataLinks.sort((left, right) => {
							return left.outcomeHref.localeCompare(right.outcomeHref);
						});
					}

					const gradesPageLink = coaUser.getUserGradesSummaryHref();
					const learnerInfo = {
						firstName: firstName,
						lastName: lastName,
						outcomesProgressData: userOutcomeDataLinks,
						gradesPageHref: gradesPageLink
					};
					learnerInfoList.push(learnerInfo);
				});
			});

			classlist.subEntitiesLoaded().then(() => {
				this._showFirstNames = showFirstNames;
				this._showLastNames = showLastNames;
				this._learnerList = this._sortLearners(learnerInfoList, !this._nameFirstLastFormat, this._sortDesc);
				this._learnerRowsData = this._getLearnerRowsData(this._learnerList, this._currentPage, this._rowsPerPage);
				this._updatePageCount();
			});
		});

		entity.subEntitiesLoaded().then(() => {
			outcomeHeadersData.sort((left, right) => {
				return left.href.localeCompare(right.href);
			});
			this._outcomeHeadersData = outcomeHeadersData;
			this._skeletonLoaded = true;
		});
	}

	//Switch the user sort order between ascending/descending
	_onFirstLearnerHeaderButtonClicked() {
		this._sortDesc = !this._sortDesc;
		this._updateSortOrder();
	}

	_onNextPageButtonClicked() {
		if (this._currentPage < this._pageCount) {
			this._goToPageNumber(this._currentPage + 1);
		}
	}

	_onPageSelectDropdownSelectionChanged() {
		var selector = this.shadowRoot.getElementById('page-select-menu');
		const newPageNumber = parseInt(selector.options[selector.selectedIndex].value);
		this._goToPageNumber(newPageNumber);
	}

	_onPageSizeDropdownSelectionChanged() {
		var selector = this.shadowRoot.getElementById('page-size-menu');
		const newRowsPerPage = parseInt(selector.options[selector.selectedIndex].value);
		this._rowsPerPage = newRowsPerPage;
		this._updatePageCount();
	}

	_onPreviousPageButtonClicked() {
		if (this._currentPage > 1) {
			this._goToPageNumber(this._currentPage - 1);
		}
	}

	//Switches between first-last or last-first format and sorts ascending
	_onSecondLearnerHeaderButtonClicked() {
		this._nameFirstLastFormat = !this._nameFirstLastFormat;
		this._sortDesc = false;
		this._updateSortOrder();
	}

	_renderLearnerColumnHead() {

		const firstNameFirstButton = this._renderLearnerColumnSortButton(false, false);
		const firstNameSecondButton = this._renderLearnerColumnSortButton(true, false);
		const lastNameFirstButton = this._renderLearnerColumnSortButton(false, true);
		const lastNameSecondButton = this._renderLearnerColumnSortButton(true, true);

		let cellContent;

		if (!this._showFirstNames && !this._showLastNames) {
			cellContent = this.localize('name');
		}
		else if (!this._showFirstNames) {
			cellContent = lastNameFirstButton;
		}
		else if (!this._showLastNames) {
			cellContent = firstNameFirstButton;
		}
		else if (this._nameFirstLastFormat) {
			cellContent = html`
				${firstNameFirstButton}, ${lastNameSecondButton}
			`;
		}
		else {
			cellContent = html`
				${lastNameFirstButton}, ${firstNameSecondButton}
			`;
		}

		return html`
		<th sticky>
		<div class="learner-column-head">
			${cellContent}
		</div></th>
		`;
	}

	_renderLearnerColumnSortButton(isSecondButton, isLastName) {
		const text = isLastName ? this.localize('lastName') : this.localize('firstName');
		const ariaLabel = this._getLearnerHeadAriaLabel(isLastName, isSecondButton);
		const clickCallback = isSecondButton ? this._onSecondLearnerHeaderButtonClicked : this._onFirstLearnerHeaderButtonClicked;
		return html`
			<d2l-table-col-sort-button
				?desc=${this._sortDesc}
				?nosort=${isSecondButton}
				@click="${clickCallback}}"
				role="region"
				aria-label="${ariaLabel}"
			>
				${text}
			</d2l-table-col-sort-button>
		`;
	}

	_renderLearnerRow(learnerData) {
		const userNameDisplay = this._getUserNameDisplay(learnerData.firstName, learnerData.lastName);

		if (!learnerData.outcomesProgressData) {
			return this._renderNoLearnerState(this.localize('learnerHasNoData', 'username', learnerData.firstName + ' ' + learnerData.lastName));
		}

		return html`
		<tr>
			<th scope="row" sticky class="learner-name-cell">
			<div class="learner-name-container">
				<a
					href="${learnerData.gradesPageHref}"
					class="d2l-link learner-name-label"
					role="region"
					aria-label=${this.localize('goToUserAchievementSummaryPage')}
					title=${userNameDisplay}
				>
					${userNameDisplay}
				</a>
			</div>
			</th>
			${learnerData.outcomesProgressData.map(outcomeData => { return html`
				<td role="cell" class="learner-outcome-cell">
					<d2l-mastery-view-user-outcome-cell
						href="${outcomeData.activityCollectionHref}"
						token="${this.token}"
					/>
				</td>
				`; })}
		</tr>
		`;
	}

	_renderNoLearnerState(rowText) {
		//1 column per outcome, plus learner column, plus (later) checkbox column
		const colSpan = this._outcomeHeadersData.length + 1;
		return html`
			<tr>
				<td id="no-learners-cell" colspan="${colSpan}">
					<div class="no-learners-label">${rowText}</div>
				</td>
			</tr>
		`;
	}

	_renderOutcomeColumnHead(outcomeData, index) {
		let tooltipAlign = 'center';
		if (index === 0) {
			tooltipAlign = 'start';
		}
		else if (index === this._outcomeHeadersData.length - 1) {
			tooltipAlign = 'end';
		}

		return html`
		<th scope="col" class="outcome-column-head">
			<d2l-mastery-view-outcome-header-cell
				href="${outcomeData.activityCollectionHref}"
				token="${this.token}"
				outcome-name="${outcomeData.name}"
				outcome-description="${outcomeData.description}"
				tooltip-align="${tooltipAlign}"
				display-unassessed
				aria-label="${this.localize('outcomeInfo', 'name', outcomeData.name, 'description', outcomeData.description)}"
			/>
		</th>`;

	}

	_renderTableBody(rowsData) {
		if (this._skeletonLoaded && rowsData.length === 0) {
			return this._renderNoLearnerState(this.localize('noEnrolledLearners'));
		}
		return rowsData.map(item => this._renderLearnerRow(item));
	}

	_renderTableControls() {
		if (this._learnerList.length <= DEFAULT_ROW_SIZE) {
			return null;
		}
		const pageSelectOptionTemplates = [];
		for (var i = 1; i <= this._pageCount; i++) {
			pageSelectOptionTemplates.push(html`
				<option value=${i}>
					${this.localize('pageSelectOptionText', 'currentPage', i, 'pageCount', this._pageCount)}
				</option>
			`);
		}

		const pageSizeOptionTemplates = [];
		PAGE_ROW_SIZES.map(pageSize => {
			pageSizeOptionTemplates.push(html`
				<option value=${pageSize} ?selected=${pageSize === this._rowsPerPage}>
					${this.localize('pageSizeSelectOptionText', 'pageSize', pageSize)}
				</option>
			`);
		});

		return html`
		<table id="pagination-controls-container" aria-hidden="true">
			<tr>
				<td class="prev-page-button-container">
					<d2l-button-subtle
						class="prev-page-button"
						text=""
						?disabled=${!this._shouldShowPrevPageButton()}
						@click=${this._onPreviousPageButtonClicked}
						aria-label=${this.localize('goToPreviousPage')}
					>
						<d2l-icon-left-arrow ?hidden=${!this._shouldShowPrevPageButton()} />
					</d2l-button-subtle>
				</td>
				<td class="page-label-container">
					<div id="page-label">${this.localize('page')}</div>
				</td>
				<td class="page-select-menu-container">
					<select
						id="page-select-menu"
						class="d2l-input-select"
						@change=${this._onPageSelectDropdownSelectionChanged}}
						aria-label=${this.localize('selectTablePage')}
						aria-controls="new-page-select-live-text"
					>
						${pageSelectOptionTemplates}
					</select>
				</td>
				<td class="next-page-button-container">
					<d2l-button-subtle
						class="next-page-button"
						text=""
						?disabled=${!this._shouldShowNextPageButton()}
						@click=${this._onNextPageButtonClicked}
						aria-label=${this.localize('goToNextPage')}
					>
						<d2l-icon-right-arrow ?hidden=${!this._shouldShowNextPageButton()} />
					</d2l-button-subtle>
				</td>
				<td class="page-size-menu-container">
					<select
						id="page-size-menu"
						class="d2l-input-select"
						@change=${this._onPageSizeDropdownSelectionChanged}}
						aria-label=${this.localize('selectLearnersPerPage')}
						aria-controls="new-page-size-live-text"
					>
						${pageSizeOptionTemplates}
					</select>
				</td>
			<tr>
		</table>
		<div
			role="region"
			id="new-page-select-live-text"
			aria-live="polite"
			aria-label=${this.localize('newPageSelectLiveText', 'pageNum', this._currentPage, 'totalPages', this._pageCount)}
		/>
		<div
			role="region"
			id="new-page-size-live-text"
			aria-live="polite"
			aria-label=${this.localize('newPageSizeLiveText', 'pageSize', this._rowsPerPage)}
		/>
		`;
	}

	_renderTableHead() {
		return html`
		<tr header>
			${this._renderLearnerColumnHead(this._nameFirstLastFormat)}
			${this._outcomeHeadersData.map((item, index) => { return this._renderOutcomeColumnHead(item, index); })}
		</tr>
		`;
	}

	_shouldShowNextPageButton() {
		return this._currentPage < this._pageCount;
	}

	_shouldShowPrevPageButton() {
		return this._currentPage > 1;
	}

	_sortLearners(list, byLastName, descending) {
		list.sort((left, right) => {
			let leftSortString = '';
			let rightSortString = '';

			const leftFirst = left.firstName || '';
			const leftLast = left.lastName || '';
			const rightFirst = right.firstName || '';
			const rightLast = right.lastName || '';

			if (byLastName) {
				leftSortString = leftLast + '_' + leftFirst;
				rightSortString = rightLast + '_' + rightFirst;
			}
			else {
				leftSortString = leftFirst + '_' + leftLast;
				rightSortString = rightFirst + '_' + rightLast;
			}

			if (descending) {
				return rightSortString.localeCompare(leftSortString);
			}
			else {
				return leftSortString.localeCompare(rightSortString);
			}
		});
		return list;
	}

	_updatePageCount() {
		const learnerCount = this._learnerList.length;
		if (learnerCount === 0) {
			this._pageCount = 1;
		}
		else {
			this._pageCount = Math.ceil(learnerCount / this._rowsPerPage);
		}

		if (this._currentPage > this._pageCount) {
			this._goToPageNumber(this._pageCount);
		}
		this._learnerRowsData = this._getLearnerRowsData(this._learnerList, this._currentPage, this._rowsPerPage);
	}

	_updateSortOrder() {
		this._learnerList = this._sortLearners(this._learnerList, !this._nameFirstLastFormat, this._sortDesc);
		this._learnerRowsData = this._getLearnerRowsData(this._learnerList, this._currentPage, this._rowsPerPage);
	}

}

customElements.define(MasteryViewTable.is, MasteryViewTable);
