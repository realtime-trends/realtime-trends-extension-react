/* global chrome */
import axios from 'axios';
import cheerio from 'cheerio';

const WEIGHTS = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11];
const ENGINE_BIAS = {
  nate: 0.7,
  zum: 1.0,
};
const SIMILARITY_WEIGHT = 0.7;
const DELTA_NEW = 999;
const TIME_BEFORE = 600;
const MAX_STORAGE = 100;

// eslint-disable-next-line no-extend-native
String.prototype.hashCode = function () {
  var hash = 0;
  if (this.length === 0) {
    return hash;
  }
  for (var i = 0; i < this.length; i++) {
    var char = this.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
};

axios.defaults.headers = {
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
  Expires: '0',
};

async function getKeywordsByEngine(engine) {
  var keywords = {};
  if (engine.localeCompare('zum') === 0) {
    await axios.get('https://search.zum.com/search.zum').then((data) => {
      const $ = cheerio.load(data.data);
      $('#issue_wrap > ul > li > div > a:nth-child(1) > span.txt').each((index, item) => {
        const keyword = item.children[0].data;
        keywords[keyword] = WEIGHTS[index] * ENGINE_BIAS[engine];
      });
    });
  } else if (engine.localeCompare('nate') === 0) {
    await axios({
      method: 'GET',
      url: 'https://www.nate.com/js/data/jsonLiveKeywordDataV1.js',
      responseType: 'arraybuffer',
    })
      .then((response) => {
        var enc = new TextDecoder('euc-kr');
        return JSON.parse(enc.decode(response.data));
      })
      .then((data) => {
        data.forEach((item, index) => {
          const keyword = item[1];
          keywords[keyword] = WEIGHTS[index] * ENGINE_BIAS[engine];
        });
      });
  }
  return keywords;
}

function removeSimilarKeywords(keywords) {
  Object.values(keywords).forEach((keyword1) => {
    const hashedKeyword1 = keyword1.hashedKeyword;
    let isContain = false;
    Object.values(keywords)
      .filter((keyword2) => keyword1.keyword !== keyword2.keyword)
      .forEach((keyword2) => {
        const hashedKeyword2 = keyword2.hashedKeyword;
        if (keyword1.keyword.includes(keyword2.keyword)) {
          keywords[hashedKeyword2]['score'] +=
            keywords[hashedKeyword1]['score'] * SIMILARITY_WEIGHT;
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
  items.sort(function (first, second) {
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
  return typeof result !== 'undefined' ? result : default_value;
}

export async function updateKeyword() {
  console.log('Start to update keyword');
  let checked = {};
  for (let engine of ['zum', 'nate']) {
    const keywords = await getKeywordsByEngine(engine);
    Object.entries(keywords).forEach(([keyword, score]) => {
      const hashedKeyword = keyword.replace(' ', '').hashCode();
      let keywordInfo = get(checked, hashedKeyword, null);
      if (keywordInfo !== null) {
        keywordInfo['score'] += score;
        keywordInfo['maxScore'] = Math.max(keywordInfo['maxScore'], score);
      } else {
        keywordInfo = {
          hashedKeyword: hashedKeyword,
          keyword: keyword,
          score: score,
          maxScore: score,
        };
      }
      checked[hashedKeyword] = keywordInfo;
    });
  }
  const keywords = removeSimilarKeywords(checked);
  const sortedKeywords = sortKeywords(keywords);
  saveKeywordToStorage(sortedKeywords);
  console.log('Finish to update keyword');
}

function getRankByHashedKeyword(keywords, hashedKeyword) {
  for (let keyword of keywords) {
    if (keyword.hashedKeyword === hashedKeyword) {
      return keyword.rank;
    }
  }
  return DELTA_NEW;
}

export function updateRanking(setRanking, timeBefore = TIME_BEFORE) {
  getStorageByKeywords((keywords) => {
    let newKeywordsTs = Math.max.apply(null, Object.keys(keywords));
    let beforeKeywordsTs = Math.max.apply(
      null,
      Object.keys(keywords).filter((ts) => ts < Date.now() - timeBefore * 1000)
    );
    let newKeywords = keywords[newKeywordsTs];
    let beforeKeywords =
      beforeKeywordsTs === -Infinity ? [] : keywords[beforeKeywordsTs];
    let ranking = [];
    for (let newKeyword of newKeywords) {
      const hashedKeyword = newKeyword.hashedKeyword;
      let beforeRank = null;
      if (beforeKeywords.length > 0) {
        beforeRank = getRankByHashedKeyword(beforeKeywords, hashedKeyword);
      }
      ranking.push({
        rank: newKeyword.rank,
        keyword: newKeyword.keyword,
        delta:
          beforeRank == null
            ? 0
            : beforeRank === DELTA_NEW
            ? DELTA_NEW
            : beforeRank - newKeyword.rank,
      });
    }
    setRanking(ranking);
  });
}

export function getStandardTime(setStandardTime) {
  getStorageByKeywords((keywords) => {
    let standardTimeTs = Math.max.apply(null, Object.keys(keywords));
    let standardTime = new Date(standardTimeTs);
    let year = standardTime.getFullYear();
    let month = ('0' + (standardTime.getMonth() + 1)).slice(-2);
    let day = ('0' + standardTime.getDate()).slice(-2);
    let hour = ('0' + standardTime.getHours()).slice(-2);
    let minute = ('0' + standardTime.getMinutes()).slice(-2);
    setStandardTime(`${year}년 ${month}월 ${day}일 ${hour}:${minute}`);
  });
}

function saveKeywordToStorage(sortedKeywords) {
  let keywords = [];
  sortedKeywords.forEach((keyword, index) => {
    keyword.rank = index + 1;
    keywords.push(keyword);
  });
  addStorage(keywords);
}

function getStorageByKeywords(callback, expiry = null) {
  chrome.storage.local.get('keywords', function (items) {
    let cached = {};
    if (items.hasOwnProperty('keywords')) {
      cached = items['keywords'];
    }
    callback(cached);
  });
}

function setStorageByKeywords(content) {
  chrome.storage.local.set({ keywords: content }, function () {
    console.log('saved keyword items');
  });
}

function addStorage(keywords, timestamp = Date.now()) {
  getStorageByKeywords((cached) => {
    cached[timestamp] = keywords;
    cached = Object.fromEntries(
      Object.entries(cached).filter(
        (_, index, arr) => index > arr.length - MAX_STORAGE
      )
    );
    setStorageByKeywords(cached);
  })
}
