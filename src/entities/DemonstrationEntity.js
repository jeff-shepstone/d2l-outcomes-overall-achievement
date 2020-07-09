import { Entity } from 'siren-sdk/src/es6/Entity';
import { SelflessEntity } from 'siren-sdk/src/es6/SelflessEntity';
import { AchievementLevelEntity } from './AchievementLevelEntity';
import { FeedbackListEntity } from './FeedbackListEntity';

export class DemonstrationEntity extends Entity {
	static get class() { return 'demonstration'; }

	static get classes() {
		return {
			assessed: 'assessed',
			published: 'published'
		};
	}

	static get links() {
		return {
			feedback: 'https://user-progress.api.brightspace.com/rels/feedback'
		};
	}

	getDateAssessed() {
		return this._entity && this._entity.properties && this._entity.properties.dateAssessed;
	}

	getDemonstratedLevel() {
		if (!this._entity) {
			return;
		}

		const levelEntity = this._entity.getSubEntityByClasses([DemonstratableLevelEntity.class, DemonstratableLevelEntity.classes.selected]);
		return new DemonstratableLevelEntity(this, levelEntity);
	}

	isPublished() {
		return this._entity.hasClass(DemonstrationEntity.classes.published);
	}

	onFeedbackChanged(onChange) {
		const href = this._feedbackHref();
		href && this._subEntity(FeedbackListEntity, href, onChange);
	}

	_feedbackHref() {
		if (!this._entity || !this._entity.hasLinkByRel(DemonstrationEntity.links.feedback)) {
			return;
		}

		return this._entity.getLinkByRel(DemonstrationEntity.links.feedback).href;
	}
}

export class DemonstratableLevelEntity extends SelflessEntity {
	static get class() { return 'demonstratable-level'; }

	static get classes() {
		return {
			selected: 'selected'
		};
	}

	static get links() {
		return {
			level: 'https://achievements.api.brightspace.com/rels/level'
		};
	}

	getLevelId() {
		return this._entity && this._entity.properties && this._entity.properties.levelId;
	}

	onLevelChanged(onChange) {
		const href = this._levelHref();
		href && this._subEntity(AchievementLevelEntity, href, onChange);
	}

	_levelHref() {
		if (!this._entity || !this._entity.hasLinkByRel(DemonstratableLevelEntity.links.level)) {
			return;
		}

		return this._entity.getLinkByRel(DemonstratableLevelEntity.links.level).href;
	}
}
