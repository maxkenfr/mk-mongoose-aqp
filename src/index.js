const debug = require('debug')('mk-mongoose-aqp');
const aqp = require('./aqp');
const _ = require('lodash');

const defaultConf = {
    blacklist: ['page'],
    limit : false,
    maxLimit : false,
    skip : 0,
    sort : '',
    queries : {},
    casters : {},
    castParams : {}
};

function mergeConf(oldConf, newConf) {
    let queries = {...oldConf.queries, ...newConf.queries};
    return {
        ...oldConf,
        ...newConf,
        queries,
        blacklist : _.union(oldConf.blacklist, newConf.blacklist, Object.keys(queries)),
        casters : {...oldConf.casters, ...newConf.casters},
        castParams : {...oldConf.castParams, ...newConf.castParams}
    }
}

function aqpPlugin(schema, confG) {
    let globalConf = mergeConf(defaultConf, confG);
    let aqpQuery = function (query, conf = {}) {
        let mergedConf = mergeConf(globalConf, conf);
        if (Array.isArray(conf.whitelist)) mergedConf.whitelist = Array.isArray(globalConf.whitelist) ?  _.union(globalConf.whitelist, conf.whitelist) : conf.whitelist;
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