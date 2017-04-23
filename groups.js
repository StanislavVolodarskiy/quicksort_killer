#!/usr/bin/env node

var _ = require('lodash');

var make_group = function(pivot, start) {
    return {
        pivot: pivot,
        start: start,
        members: []
    };
};

var make_group_updater = function(from_index, groups) {
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
        if (index >= from_index) {
            pair = [
                find_group(a),
                find_group(b)
            ];
            pair[0].members.push(b);
            pair[1].members.push(a);
        }
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
        var update_groups = make_group_updater(from_index, groups);
        return make_cmp(order, function(a, b) {
            calls.push([a, b]);
            update_groups(a, b);
        });
    })();

    var sorted_list = list.slice(0).sort(cmp);

    var longest_group = _.maxBy(groups, function(group) {
        return group.members.length;
    });

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
        }
    };
};

var lt = function(a, b) { return a < b; };
var gt = function(a, b) { return a > b; };

var make_comparator = function(pred, i, calls) {
    var list_dict = make_default_dict(function() {
        return [];
    });

    _.each(calls, function(call) {
        var a = call[0];
        var b = call[1];
        if (pred(a, b)) { list_dict(b).push(a); }
        if (pred(b, a)) { list_dict(a).push(b); } 
    });

    var set = make_set();
    var gather = function(i) {
        if (!set.has(i)) {
            set.add(i);
            _.each(list_dict(i), gather);
        }
    };
    gather(i);

    return function(j) {
        return set.has(j);
    };
};

var not_pred = function(pred) {
    return function(v) {
        return !pred(v);
    };
};

var compact = function(list) {
    var min = _.min(list);
    var list0 = _.map(list, function(v) {
        return v - min;
    });

    var values = [];
    _.each(list0, function(v) {
        values[v] = v;
    });

    var shift = 0;
    for (var i = 0; i < values.length; ++i) {
        if (values[i] === undefined) {
            ++shift;
        } else {
            values[i] -= shift;
        }
    }

    return _.map(list0, function(v) {
        return values[v];
    });
};

var shift_list = function(list, shift, pred) {
    return compact(_.map(list, function(v) {
        return pred(v) ? v + shift : v;
    }));
};

var log_group = function(group) {
    console.log(
        group.pivot,
        group.start,
        group.start + group.members.length,
        group.members.join(' ')
    );
};

n = 31;
var list0 = range(n);
var longest_group = find_longest_group(list0, 3);

console.log('longest group:');
log_group(longest_group.group);

var calls_before = longest_group.calls.slice(0, longest_group.group.start);
console.log(calls_before);
var le = make_comparator(lt, longest_group.group.pivot, calls_before);
var ge = make_comparator(gt, longest_group.group.pivot, calls_before);
_.each(range(n), function(i) {
    if (le(i)) {
        console.log(i, '<=');
    }
    if (ge(i)) {
        console.log(i, '=>');
    }
});

var list1 = shift_list(list0, n, not_pred(le));
var longest_group = find_longest_group(list1, 0);

console.log('longest group:');
log_group(longest_group.group);
console.log(list0.join(' '));
console.log(list1.join(' '));

var longest_group = find_longest_group(list1, 31);
console.log('longest group:');
log_group(longest_group.group);
