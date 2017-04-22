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

    var sorted_list = list.sort(cmp);

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

var list = [];
for (var i = 0; i < 31; ++i) {
    list.push(i);
}

var longest_group = find_longest_group(list, 0);

console.log('longest group:');
console.log(
    longest_group.group.pivot,
    longest_group.group.start,
    longest_group.group.start + longest_group.group.members.length,
    longest_group.group.members.join(' ')
);
