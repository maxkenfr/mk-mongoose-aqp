const debug = require('debug')('mk-mongoose-aqp');
const aqp = require('./aqp');

const defaultConf = {
    blacklist: ['page'],
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
            casters : {...confG.casters, ...conf.casters},
            castParams : {...confG.castParams, ...conf.castParams}
        };
        if (Array.isArray(conf.whitelist)) mergedConf.whitelist = Array.isArray(confG.whitelist) ?  [...confG.whitelist, ...conf.whitelist] : conf.whitelist;
        let extracted = aqp(query, mergedConf);
        let {filter = {}, skip = 0, limit = 20, sort = '', projection = {}} = extracted;
        if (query.page) skip = limit * (query.page - 1);
        debug('Extracted : %O', extracted);
        debug('Query : %O', filter);
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