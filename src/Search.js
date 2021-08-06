import queryString from 'query-string'
import env from 'config'

const SERVER_URL = env.SERVER_URL || "https://realtime-trends.herokuapp.com"

function query(engine, term) {
  if (engine === "naver") {
    return 'https://search.naver.com/search.naver?query=' + term;
  } else {
    return 'https://search.naver.com/search.naver?query=' + term;
  }
}

function Search({location, match}) {
  console.log(match.params);
  const { engine } = queryString.parse(location.search);

  if (match.params.method === "issue") {
    fetch(SERVER_URL + '/api/search' + match.params.term).then(res => res.json()).then(data => {
      window.location.href = query(engine, data.word);
    });
  } else {
    window.location.href = query(engine, match.params.term);
  }
  return null;
}

export default Search;