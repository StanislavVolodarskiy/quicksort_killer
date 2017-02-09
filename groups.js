#!/usr/bin/env node

var _ = require('lodash');

var make_group = function(pivot, start) {
    return {
        pivot: pivot,
        start: start,
        members: []
    };
};

var order = function(a, b) {
    if (a < b) return -1;
    if (a > b) return  1;
               return  0;
};

var make_cmp = function() {
    var index = 0;
    var groups = [];
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

    return {
        cmp: function(a, b) {
            if (a !== b) {
                pair = [
                    find_group(a),
                    find_group(b)
                ];
                pair[0].members.push(b);
                pair[1].members.push(a);
            }
            ++index;
            return order(a, b);
        },
        groups: groups
    };
};

var cmp = make_cmp();

var list = [];
for (var i = 0; i < 31; ++i) {
    list.push(i);
}

list = list.sort(cmp.cmp);
console.log('sorted list:');
console.log(list.join(' '));
console.log();
if (true) {
    cmp.groups.sort(function(a, b) {
        return -order(a.members.length, b.members.length);
    });
}
console.log('groups:');
_.each(cmp.groups, function(group) {
    if (group.members.length > 1) {
        console.log(
            group.pivot,
            group.start,
            group.start + group.members.length,
            group.members.join(' ')
        );
    }
});
