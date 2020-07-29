import { Entity } from 'siren-sdk/src/es6/Entity';
import { OutcomeEntity } from './OutcomeEntity';
import { OutcomeActivityCollectionEntity } from './OutcomeActivityCollectionEntity';

export class UserProgressOutcomeEntity extends Entity {
	static get class() { return 'user-progress-outcome'; }

	static get links() {
		return {
			outcomeRel: 'https://outcomes.api.brightspace.com/rels/outcome',
			outcomeActivitiesRel: 'https://user-progress.api.brightspace.com/rels/outcome-activities'
		};
	}

	onOutcomeActivitiesChanged(onChange) {
		const href = this._outcomeActivitiesHref();
		href && this._subEntity(OutcomeActivityCollectionEntity, href, onChange);
	}
	onOutcomeChanged(onChange) {
		const href = this._outcomeHref();
		href && this._subEntity(OutcomeEntity, href, onChange);
	}

	_outcomeActivitiesHref() {
		if (!this._entity || !this._entity.hasLinkByRel(UserProgressOutcomeEntity.links.outcomeActivitiesRel)) {
			return;
		}

		return this._entity.getLinkByRel(UserProgressOutcomeEntity.links.outcomeActivitiesRel).href;
	}
	_outcomeHref() {
		if (!this._entity || !this._entity.hasLinkByRel(UserProgressOutcomeEntity.links.outcomeRel)) {
			return;
		}

		return this._entity.getLinkByRel(UserProgressOutcomeEntity.links.outcomeRel).href;
	}

}
