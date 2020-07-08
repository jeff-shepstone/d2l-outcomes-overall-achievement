import { Entity } from 'siren-sdk/src/es6/Entity';
import { DemonstrationEntity } from './DemonstrationEntity';

export class OutcomeActivityEntity extends Entity {
	static get class() { return 'user-progress-outcome-activity'; }

	getName() {
		return this._entity && this._entity.properties && this._entity.properties.name;
	}
	onAssessedDemonstrationChanged(onChange) {
		const assessedDemonstrations = this._getAssessedDemonstrations();
		assessedDemonstrations.forEach((demonstration, index) => {
			const onChangeWithIndex = (x) => {
				x.index = index;
				onChange(x);
			};
			demonstration && this._subEntity(DemonstrationEntity, demonstration, onChangeWithIndex);
		});
	}

	_getAssessedDemonstrations() {
		if (!this._entity) {
			return;
		}

		return this._entity.getSubEntitiesByClasses([DemonstrationEntity.class, DemonstrationEntity.classes.assessed]);
	}

}
