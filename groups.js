#!/usr/bin/env node

var _ = require('lodash');

var make_group = function(pivot, start) {
    return {
        pivot: pivot,
        start: start,
        members: []
    };
};

var make_group_updater = function(groups) {
    var index = 0;
    var pair = [];

    var find_group = function(x) {
        var group = undefined;
        _.each(pair, function(item) {
            if (x === item.pivot) {
                group = item;
            }
        });
        if (group === undefined) {
            group = make_group(x, index);
            groups.push(group);
        }
        return group;
    };

    return function(a, b) {
        pair = [
            find_group(a),
            find_group(b)
        ];
        pair[0].members.push(b);
        pair[1].members.push(a);
        ++index;
    };
};

var order = function(a, b) {
    if (a < b) return -1;
    if (a > b) return  1;
               return  0;
};

var make_cmp = function(order, cb) {
    return function(a, b) {
        var o = order(a, b);
        if (o !== 0) {
            cb(a, b);
        }
        return o;
    };
};

var find_longest_group = function(list, from_index) {
    var groups = [];
    var calls = [];

    var cmp = (function() {
        var update_groups = make_group_updater(groups);
        return make_cmp(order, function(a, b) {
            calls.push([a, b]);
            update_groups(a, b);
        });
    })();

    var sorted_list = list.slice(0).sort(cmp);

    var longest_group = _.maxBy(
        _.filter(
            groups,
            function(group) {
                return group.start >= from_index;
            }
        ),
        function(group) {
            return group.members.length;
        }
    );

    return {
        group: longest_group,
        sorted_list: sorted_list,
        calls: calls
    };
};

var range = function(n) {
    var list = [];
    for (var i = 0; i < n; ++i) {
        list.push(i);
    }
    return list;
};

var make_default_dict = function(f) {
    var data = {};
    return function(key) {
        if (!data.hasOwnProperty(key)) {
            data[key] = f();
        }
        return data[key];
    };
};

var make_set = function() {
    var data = {};
    return {
        add: function(v) {
            data[v] = undefined;
        },
        has: function(v) {
            return data.hasOwnProperty(v);
        },
        each: function(f) {
            _.forOwn(data, function(_, key) {
                f(key);
            });
        }
    };
};

var make_set_dict = function() {
    return make_default_dict(function() {
        return make_set();
    });
};

var make_comparator = function(i, calls) {
    var below = make_set_dict();
    var above = make_set_dict();

    var store = function(a, b) {
        below(b).add(a);
        above(a).add(b);
    };

    _.each(calls, function(call) {
        var a = call[0];
        var b = call[1];
        if (a < b) {
            store(a, b);
        } else if (a > b) {
            store(b, a);
        }
    });

    var gather = function(i, set_dict) {
        var set = make_set();
        var gather = function(i) {
            if (!set.has(i)) {
                set.add(i);
                set_dict(i).each(gather);
            }
        };
        gather(i);
        return set;
    };

    var le = gather(i, below);
    var ge = gather(i, above);

    return {
        le: function(j) { return le.has(j); },
        ge: function(j) { return ge.has(j); }
    };
};

n = 31;
var longest_group = find_longest_group(range(n), 0);

console.log('longest group:');
console.log(
    longest_group.group.pivot,
    longest_group.group.start,
    longest_group.group.start + longest_group.group.members.length,
    longest_group.group.members.join(' ')
);

var calls_before = longest_group.calls.slice(0, longest_group.group.start);
console.log(calls_before);
var comparator = make_comparator(longest_group.group.pivot, calls_before);
_.each(range(n), function(i) {
    if (comparator.le(i)) {
        console.log(i, '<=');
    }
    if (comparator.ge(i)) {
        console.log(i, '=>');
    }
});
