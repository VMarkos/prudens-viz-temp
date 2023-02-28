class GraphNode {
    constructor(type, x, y, label, d) {
        this._type = type; // `type` might be "Context", "Rule", "Simple".
        this._x = x;
        this._y = y;
        this._label = label;
        this._d = d;
    }

    get x() {
        return this._x;
    }

    get y() {
        return this._y;
    }

    get type() {
        return this._type;
    }

    get label() {
        return this._label;
    }

    get d() {
        return this._d;
    }
}

class GraphEdge {
    constructor(start, end) { // `start` and `end` are both Nodes.
        this._start = start;
        this._end = end;
    }

    get start() {
        return this._start;
    }

    get end() {
        return this._end;
    }
}