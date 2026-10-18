export const labelColors = ["gray", "red", "amber", "green", "blue", "pink"] as const;
export type LabelColor = (typeof labelColors)[number];
export type TaskLabel = { id: LabelColor; name: string };
export const defaultLabels: TaskLabel[] = labelColors.map(id => ({ id, name: id[0].toUpperCase() + id.slice(1) }));
