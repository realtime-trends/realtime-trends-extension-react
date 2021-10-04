import axios from 'axios';
import cheerio from 'cheerio';

const WEIGHTS = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11];
const ENGINE_BIAS = {
    nate: 0.7,
    zum: 1.0
};
const SIMILARITY_WEIGHT = 0.7;
const DELTA_NEW = 999;

// eslint-disable-next-line no-extend-native
String.prototype.hashCode = function() {
    var hash = 0;
    if (this.length === 0) {
        return hash;
    }
    for (var i = 0; i < this.length; i++) {
        var char = this.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

axios.defaults.headers = {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Expires': '0',
};

async function getKeywordsByEngine(engine) {
    var keywords = {};
    if (engine.localeCompare("zum") === 0) {
     await axios.get("https://issue.zum.com/").then(data => {
            const $ = cheerio.load(data.data);
            $("#issueKeywordList > li > .cont > .word").each((index, item)=>{
                const keyword = item.children[0].data;
                keywords[keyword] = WEIGHTS[index]*ENGINE_BIAS[engine];
            });
        })
    } else if (engine.localeCompare("nate") === 0) {
        await axios({
            method: 'GET',
            url: 'https://www.nate.com/js/data/jsonLiveKeywordDataV1.js',
            responseType: 'arraybuffer'
        }).then(response => {
            var enc = new TextDecoder("euc-kr");
            return JSON.parse(enc.decode(response.data));
        }).then(data => {
            data.forEach((item, index) => {
                const keyword = item[1];
                keywords[keyword] = WEIGHTS[index]*ENGINE_BIAS[engine];
            });
        });
    }
    return keywords;
};

function removeSimilarKeywords(keywords) {
    Object.values(keywords).forEach(keyword1 => {
        const hashedKeyword1 = keyword1.hashedKeyword;
        let isContain = false;
        Object.values(keywords).filter(keyword2 => keyword1.keyword !== keyword2.keyword).forEach(keyword2 => {
            const hashedKeyword2 = keyword2.hashedKeyword;
            if (keyword1.keyword.includes(keyword2.keyword)) {
                keywords[hashedKeyword2]['score'] += keywords[hashedKeyword1]['score']*SIMILARITY_WEIGHT;
                isContain = true;
            }
        });
        if (isContain) {
            delete keywords[hashedKeyword1];
        }
    });
    return Object.values(keywords);
}

function sortKeywords(keywords) {
    const items = Object.assign([], keywords);
    items.sort(function(first, second) {
        if (first.score !== second.score) {
            return second.score - first.score;
        } else if (first.maxScore !== second.maxScore) {
            return second.maxScore - first.maxScore;
        }
        return first.keyword.localeCompare(second.keyword);
    });
    return items.map((item, index) => {
        item.rank = index + 1;
        return item;
    });
}

function get(object, key, default_value) {
    var result = object[key];
    return (typeof result !== "undefined") ? result : default_value;
}

async function updateKeyword(setRanking) {
    console.log("Start to update keyword");
    let checked = {}
    for (let engine of ['zum', 'nate']) {
        const keywords = await getKeywordsByEngine(engine);
        Object.entries(keywords).forEach(([keyword, score]) => {   
            const hashedKeyword = keyword.replace(" ", "").hashCode();
            let keywordInfo = get(checked, hashedKeyword, null)
            if (keywordInfo !== null) {
                keywordInfo['score'] += score;
                keywordInfo['maxScore'] = Math.max(keywordInfo['maxScore'], score)
            } else {
                keywordInfo = {
                    hashedKeyword: hashedKeyword,
                    keyword: keyword,
                    score: score,
                    maxScore: score
                }
            }
            checked[hashedKeyword] = keywordInfo
        });
    }
    const keywords = removeSimilarKeywords(checked)
    const sortedKeywords = sortKeywords(keywords)
    const ranking = saveRankingToStorage(sortedKeywords);
    saveKeywordToStorage(sortedKeywords);
    setRanking(ranking);
    console.log("Finish to update keyword")
}

function getRankByHashedKeyword(keywords, hashedKeyword) {
    for (let keyword of keywords) {
        if (keyword.hashedKeyword === hashedKeyword) {
            return keyword.rank;
        }
    }
    return null;
}

function getDeltaByKeyword(keyword) {
    const beforeKeywords = getStorage("keywords");
    const hashedKeyword = keyword.hashedKeyword;
    const beforeRank = getRankByHashedKeyword(beforeKeywords, hashedKeyword);
    if (beforeRank == null) {
        return DELTA_NEW;
    } else {
        return beforeRank - keyword.rank;
    }
}

function saveRankingToStorage(keywords) {
    let ranking = []
    for (let keyword of keywords) {
        ranking.push({
            rank: keyword.rank,
            keyword: keyword.keyword,
            delta: getDeltaByKeyword(keyword)
        });
    }
    setStorage("ranking", JSON.stringify(ranking));
    return ranking;
}

function saveKeywordToStorage(sortedKeywords) {
    let keywords = [];
    sortedKeywords.forEach((keyword, index) => {
        keyword.rank = index + 1;
        keywords.push(keyword);
    })
    setStorage("keywords", JSON.stringify(keywords));
}
    
function getStorage(key, expiry=null) {
    let cacheKey = key;
    let cached = localStorage.getItem(cacheKey);
    let whenCached = localStorage.getItem(cacheKey + ':ts');
    if (cached !== null && whenCached !== null) {
      let age = (Date.now() - whenCached) / 1000;
      if (expiry === null || age < expiry) {
        return JSON.parse(cached);
      } else {
        return []
      }
    }
    return [];
}

function setStorage(cacheKey, content) {
    localStorage.removeItem(cacheKey);
    localStorage.removeItem(cacheKey + ':ts');
    localStorage.setItem(cacheKey, content);
    localStorage.setItem(cacheKey+':ts', Date.now());
    return sortKeywords;
} 

export function updateRanking(expiry, maxRank, setRanking) {
    let ranking = getStorage("ranking", expiry);
    if (ranking.length === 0) {
        updateKeyword(setRanking);
    } else {
        setRanking(ranking);
    }
}