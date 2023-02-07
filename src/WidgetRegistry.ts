import { type NearWidget } from "./NearWidget";

const registry: Record<string, NearWidget> = {};

export const getWidget = (uriStr :string): NearWidget | null => {
    const w = registry[uriStr];
    return w || null;
};

export const setWidget = (widget: NearWidget): void => {
    registry[widget.uri.toString()];
};

export const disposeWidget = (widget: NearWidget | string): void => {
    if (typeof widget === 'string') {
        registry[widget];
    } else {
        delete registry[widget.uri.toString()];
    }
};
