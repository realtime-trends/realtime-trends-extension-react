import * as tf from '@tensorflow/tfjs';

// 문자를 숫자 벡터로 변환하는 함수 (TensorFlow.js 텐서 사용)
function hashStringToTensor(str: string, dimensions: number = 100): tf.Tensor {
  // 초기 벡터 생성
  const vector = new Array(dimensions).fill(0);
  
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    const position = i % dimensions;
    vector[position] = (vector[position] + charCode) % 1000 / 1000;
  }
  
  // 배열을 TensorFlow 텐서로 변환
  return tf.tensor(vector);
}

// 텐서 정규화 함수
function normalizeTensor(tensor: tf.Tensor): tf.Tensor {
  return tf.tidy(() => {
    // L2 정규화 (유클리드 거리 기준)
    const squaredSum = tf.sum(tf.square(tensor));
    const epsilonTensor = tf.scalar(1e-8); // 0으로 나누는 것을 방지
    const magnitude = tf.sqrt(tf.add(squaredSum, epsilonTensor));
    
    return tf.div(tensor, magnitude);
  });
}

// 코사인 유사도 계산 함수 (TensorFlow.js 사용)
function cosineSimilarity(tensorA: tf.Tensor, tensorB: tf.Tensor): number {
  return tf.tidy(() => {
    // 내적 계산
    const dotProduct = tf.sum(tf.mul(tensorA, tensorB));
    
    // 각 벡터의 크기 계산
    const magnitudeA = tf.sqrt(tf.sum(tf.square(tensorA)));
    const magnitudeB = tf.sqrt(tf.sum(tf.square(tensorB)));
    
    // 분모가 0이 되는 것을 방지
    const epsilon = tf.scalar(1e-8);
    const denominator = tf.maximum(tf.mul(magnitudeA, magnitudeB), epsilon);
    
    // 코사인 유사도 계산 및 스칼라 값으로 변환
    return tf.div(dotProduct, denominator).dataSync()[0];
  });
}

// TF-IDF 유사 점수 계산 함수
function calculateTfIdfScore(word: string, query: string, allWords: string[]): number {
  // TF (Term Frequency): 해당 단어가 쿼리에 등장하는 빈도
  const wordRegex = new RegExp(`\\b${word}\\b`, 'gi');
  const matches = query.match(wordRegex) || [];
  const tf = matches.length / allWords.length;
  
  // IDF (Inverse Document Frequency): 단어의 희소성 (여기서는 단어 길이를 가중치로 사용)
  const idf = Math.log(1 + word.length);
  
  // 단어가 쿼리 내에서 차지하는 위치 (앞쪽에 나오는 단어가 더 중요할 수 있음)
  const position = query.toLowerCase().indexOf(word.toLowerCase());
  const positionScore = position === -1 ? 0 : 1 - (position / query.length);
  
  return tf * idf * (1 + positionScore);
}

/**
 * TensorFlow.js를 사용한 경량 모델 키워드 추출 함수
 * 불용어 목록 없이 텍스트 임베딩과 중요도 계산만으로 키워드 추출
 * @param query 검색어
 * @param maxKeywords 최대 키워드 수 (기본값: 5)
 * @returns 추출된 키워드 배열과 함께 Promise 반환
 */
export async function extractKeywords(query: string, maxKeywords: number = 5): Promise<string[]> {
  // TensorFlow.js가 로드되었는지 확인
  await tf.ready();
  
  try {
    return tf.tidy(() => {
      // 1. 검색어를 단어로 분리 (특수문자 제거 후)
      const cleanQuery = query.replace(/[^\w\s가-힣]/g, ' ').trim();
      const words = cleanQuery.split(/\s+/);
      
      // 단어가 없으면 빈 배열 반환
      if (words.length === 0) {
        return [];
      }
      
      // 2. 단어 필터링 (너무 짧은 단어 제외)
      const filteredWords = words.filter(word => {
        // 한글은 1글자 이상, 영어는 3글자 이상인 단어만 선택
        return (
          word.length > 0 && 
          (/[가-힣]/.test(word) ? word.length >= 1 : word.length >= 3)
        );
      });
      
      if (filteredWords.length === 0) {
        return [];
      }
      
      // 3. 검색어 전체의 임베딩 생성 (TensorFlow.js 텐서 사용)
      const queryTensor = hashStringToTensor(cleanQuery.toLowerCase(), 100);
      const normalizedQueryTensor = normalizeTensor(queryTensor);
      
      // 4. 각 단어의 점수 계산
      const wordScores: { word: string; score: number }[] = [];
      
      for (const word of filteredWords) {
        // 단어 임베딩 생성 (TensorFlow.js 텐서 사용)
        const wordTensor = hashStringToTensor(word.toLowerCase(), 100);
        const normalizedWordTensor = normalizeTensor(wordTensor);
        
        // 코사인 유사도 계산 (TensorFlow.js 사용)
        const similarity = cosineSimilarity(normalizedQueryTensor, normalizedWordTensor);
        
        // TF-IDF 유사 점수 계산
        const tfIdfScore = calculateTfIdfScore(word, cleanQuery, filteredWords);
        
        // 최종 점수 계산 (유사도 + TF-IDF + 단어 길이 가중치)
        const finalScore = similarity * 0.4 + tfIdfScore * 0.4 + (word.length / 10) * 0.2;
        
        wordScores.push({ word, score: finalScore });
      }
      
      // 5. 점수에 따라 정렬하고 상위 N개 반환
      wordScores.sort((a, b) => b.score - a.score);
      
      // 6. 중복 제거 (같은 단어가 다른 형태로 있을 수 있음)
      const uniqueWords: string[] = [];
      const seenWords = new Set<string>();
      
      for (const { word } of wordScores) {
        const lowerWord = word.toLowerCase();
        if (!seenWords.has(lowerWord)) {
          seenWords.add(lowerWord);
          uniqueWords.push(word);
          
          if (uniqueWords.length >= maxKeywords) {
            break;
          }
        }
      }
      
      return uniqueWords;
    });
  } catch (error) {
    console.error('TensorFlow.js 키워드 추출 중 오류 발생:', error);
    // 오류 발생 시 간단한 방식으로 폴백
    return query.split(/\s+/).filter(word => word.length > 1).slice(0, maxKeywords);
  } finally {
    // 사용한 텐서 메모리 정리
    tf.disposeVariables();
  }
}
