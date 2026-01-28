/**
 * StepModel class - Represents a step/crop in the technical itinerary
 * Manages step data, interventions, and form interactions
 */
class StepModel {
    constructor(step) {
        this.step = step;

        this.step.id = step.id ?? crypto.randomUUID();
        this.step.name = step.name ?? "";
        this.step.color = step.color ?? "#0db3bf";
        this.step.startDate = step.startDate ? new Date(step.startDate) : new Date();
        this.step.endDate = step.endDate ? new Date(step.endDate) : new Date();
        this.step.description = step.description ?? "";
        this.step.interventions = step.interventions || [];
        this.step.secondary_crop = step.secondary_crop ?? false;

        this.step.useDefaultColor = step.useDefaultColor ?? true;
        this.step.useDefaultStartDate = step.useDefaultStartDate ?? true;
        this.step.useDefaultEndDate = step.useDefaultEndDate ?? true;
    }

    setAsEdited() {
        this.step.useDefaultColor = false;
        this.step.useDefaultStartDate = false;
        this.step.useDefaultEndDate = false;
    }

    getStep() {
        return this.step;
    }

    setStartDate(date) {
        this.step.startDate = new Date(date);
    }

    setDurationInMonths(durationInMonths) {
        this.step.endDate = new Date(this.step.startDate);
        this.step.endDate.setMonth(this.step.startDate.getMonth() + durationInMonths);
    }

    setDurationInDays(durationInDays) {
        this.step.endDate = new Date(this.step.startDate);
        this.step.endDate.setDate(this.step.startDate.getDate() + durationInDays);
    }

    getDurationInDays() {
        const diffTime = Math.abs(this.step.endDate - this.step.startDate);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    addIntervention(day, name, type, description) {
        let intervention = { "id": crypto.randomUUID(), "day": day, "name": name, "type": type, "description": description };
        this.step.interventions.push(intervention);
    }

    removeIntervention(interventionId) {
        this.step.interventions = this.step.interventions.filter(function (intervention) { return intervention.id != interventionId });
    }

    updateFromForm() {
        this.step.name = $("#cropName").val();
        this.step.description = $("#cropDescription").val();
        this.step.startDate = new Date($("#cropStartDate").val());
        this.step.endDate = new Date($("#cropEndDate").val());
        this.step.color = $("#cropColor").val();
        this.step.secondary_crop = $("#cropSecondary").prop("checked")  || false;
    }
}
