const debug = require('debug')('mk-mongoose-aqp');
const aqp = require('./aqp');

const defaultConf = {
    blacklist: ['page'],
    whitelist: [],
    casters : {},
    castParams : {}
};

function aqpPlugin(schema, confG) {
    confG = {
        ...defaultConf,
        ...confG
    };
    let aqpQuery = function (query, conf = {}) {
        conf = {
            ...defaultConf,
            ...conf
        };
        let mergedConf = {
            ...confG,
            ...conf,
            blacklist : [...confG.blacklist, ...conf.blacklist],
            whitelist : [...confG.whitelist, ...conf.whitelist],
            casters : {...confG.casters, ...conf.casters},
            castParams : {...confG.castParams, ...conf.castParams}
        };
        let extracted = aqp(query, mergedConf);
        let {filter = {}, skip = 0, limit = 20, sort = '', projection = {}} = extracted;
        if (query.page) skip = limit * (query.page - 1);
        debug('%O', extracted);
        return this.where(filter)
            .limit(limit)
            .skip(skip)
            .sort(sort)
            .select(projection);
    };
    schema.query.aqp = aqpQuery;
    schema.statics.aqp = aqpQuery;
}

module.exports = aqpPlugin;