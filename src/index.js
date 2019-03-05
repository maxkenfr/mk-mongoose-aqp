const debug = require('debug')('mk-mongoose-aqp');
const aqp = require('./aqp');
const _ = require('lodash');
const defaultConf = {
    blacklist: ['page'],
    queries : {},
    casters : {},
    castParams : {}
};

function aqpPlugin(schema, confG) {
    confG = {
        ...defaultConf,
        limit : false,
        maxLimit : false,
        skip : 0,
        sort : '',
        ...confG
    };
    let aqpQuery = async function (query, conf = {}) {
        conf = {
            ...defaultConf,
            ...conf
        };
        let queries = {...confG.queries, ...conf.queries};
        let mergedConf = {
            ...confG,
            ...conf,
            queries,
            blacklist : _.union(confG.blacklist, conf.blacklist, Object.keys(queries)),
            casters : {...confG.casters, ...conf.casters},
            castParams : {...confG.castParams, ...conf.castParams}
        };
        if (Array.isArray(conf.whitelist)) mergedConf.whitelist = Array.isArray(confG.whitelist) ?  _.union(confG.whitelist, conf.whitelist) : conf.whitelist;
        let extracted = aqp(query, mergedConf);
        let {filter = {}, skip = mergedConf.skip, limit = mergedConf.limit, sort = mergedConf.sort, projection = {}} = extracted;
        if (query.page) skip = limit * (query.page - 1);
        _.forIn(mergedConf.queries, function(item, key) {
            if(query[key]) {
                let mongoQuery = typeof item === 'function' ? item(query[key], query) : item;
                filter = {...filter, ...mongoQuery};
            }
        });
        debug('Extracted : %O', extracted);
        debug('Query : %O', filter);
        return this.where(filter)
            .limit((mergedConf.maxLimit && limit > mergedConf.maxLimit) ? mergedConf.maxLimit : limit)
            .skip(skip)
            .sort(sort)
            .select(projection);
    };
    schema.statics.aqpQueryTotal = function(query){
        return this.countDocuments(query
            .limit(false)
            .skip(false)
            .sort(false));
    };
    schema.statics.aqpQueryTotalDEPRECATED = function(query){
        return this.count(query
            .limit(false)
            .skip(false)
            .sort(false));
    };
    schema.query.aqp = aqpQuery;
    schema.statics.aqp = aqpQuery;
}

module.exports = aqpPlugin;