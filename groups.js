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

var run_sort = function(list) {
    var calls = [];

    var cmp = (function() {
        return make_cmp(order, function(a, b) {
            calls.push([a, b]);
        });
    })();

    var sorted_list = list.slice(0).sort(cmp);

    return {
        calls: calls,
        sorted_list: sorted_list
    };
};

var gather_groups = function(calls, from_index) {
    var groups = [];
    var update_groups = make_group_updater(from_index, groups);
    _.each(calls, function(call) {
        update_groups(call[0], call[1]);
    });
    return groups;
};

var find_longest_group = function(list, from_index, group_pred) {
    var sorted = run_sort(list);
    var groups = gather_groups(sorted.calls, from_index);

    if (group_pred !== undefined) {
        groups = _.filter(groups, group_pred);
    }

    var longest_group = _.maxBy(groups, function(group) {
        return group.members.length;
    });

    return {
        group: longest_group,
        calls: sorted.calls,
        sorted_list: sorted.sorted_list
    };
};

var find_longest_start_group = function(list, from_index) {
    return find_longest_group(list, from_index, function(group) {
        return group.start === from_index;
    });
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

var make_v_pred = function(pred, v, calls) {
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
    var gather = function(v) {
        if (!set.has(v)) {
            set.add(v);
            _.each(list_dict(v), gather);
        }
    };
    gather(v);

    return function(v) {
        return set.has(v);
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

var worse_list = function(list, pivot, calls, pred) {
    var pivot_pred = make_v_pred(pred, pivot, calls);
    var shift = _.max(list) - _.min(list) + 1;
    if (pred(1, 0)) {
        shift = -shift;
    }
    return shift_list(list, shift, not_pred(pivot_pred));
};

var log_group = function(group) {
    console.log(
        group.pivot,
        group.start,
        group.start + group.members.length,
        group.members.join(' ')
    );
};

var accurate_worse_list = function(list, group, pred) {
    var finish = group.group.start + group.group.members.length;
    for (var start = group.group.start; start < finish; ++start) {
        var calls_before = group.calls.slice(0, start);
        var wlist = worse_list(list, group.group.pivot, calls_before, pred);
        var wgroup = find_longest_start_group(wlist, start);
        if (start + wgroup.group.members.length >= finish) {
            return wlist;
        }
    }
};

n = 400;
var list0 = range(n);

var start = 0;
var list = list0;
while(true) {
    var longest_group = find_longest_group(list, start);

    console.log('calls', longest_group.calls.length, longest_group.group.members.length);
    if (longest_group.group.members.length <= 2) {
        break;
    }

    var finish = longest_group.group.start + longest_group.group.members.length;

    var list_lt = accurate_worse_list(list, longest_group, lt);
    var list_gt = accurate_worse_list(list, longest_group, gt);

    ltg = find_longest_group(list_lt, finish);
    gtg = find_longest_group(list_gt, finish);
    if (ltg.group.members.length <= gtg.group.members.length) {
        list = list_lt;
    } else {
        list = list_gt;
    }

    list = list_lt;
    start = finish;
}
console.log(list.join(' '));
