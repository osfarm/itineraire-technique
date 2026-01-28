/**
 * Intervention class - Represents an intervention on a crop
 */
class Intervention {
    constructor(day, name, type, description) {
        this.id = crypto.randomUUID();
        this.day = day;
        this.name = name || "";
        this.type = type;
        this.description = description || "";
    }
}
