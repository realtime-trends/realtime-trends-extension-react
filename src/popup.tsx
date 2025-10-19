import React, { useEffect, ChangeEvent } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { getSettingsFromBackground, saveSettingsToBackground } from './services/messaging';
import type { SettingsState } from './utils/indexedDB';

const INITIAL_STATE: SettingsState = {
  naver: true,
  google: true,
  position: 'bottom-right',
  bottomOffset: 80,
  sideOffset: 20,
  opacity: 30,
  allowClickBehindChart: false,
};

/**
 * 설정 저장 (Background Worker를 통해)
 */
async function setStorageBySettings(content: SettingsState): Promise<void> {
  try {
    const success = await saveSettingsToBackground(content);
    if (success) {
      console.log('설정 저장 완료');
    } else {
      console.error('설정 저장 실패');
    }
  } catch (error) {
    console.error('설정 저장 실패:', error);
  }
}

/**
 * 설정 가져오기 (Background Worker를 통해)
 */
export async function getStorageBySettings(): Promise<SettingsState> {
  try {
    const settings = await getSettingsFromBackground();
    if (settings) {
      return settings;
    } else {
      // 초기 설정 저장
      await setStorageBySettings(INITIAL_STATE);
      return INITIAL_STATE;
    }
  } catch (error) {
    console.error('설정 가져오기 실패:', error);
    return INITIAL_STATE;
  }
}

export default function Popup(): React.ReactElement {
  const [state, setState] = React.useState<SettingsState>(INITIAL_STATE);

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const value = event.target.type === 'checkbox' ? event.target.checked :
                  event.target.type === 'range' ? parseFloat(event.target.value) :
                  event.target.value;

    let changed = {
      ...state,
      [event.target.name]: value,
    };

    // "차트 뒤의 버튼 클릭 가능"을 체크하면 투명도를 70으로 설정
    if (event.target.name === 'allowClickBehindChart' && value === true) {
      changed.opacity = 70;
    }

    setState(changed);
    setStorageBySettings(changed);
  };

  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    const changed = {
      ...state,
      [event.target.name]: event.target.value,
    };
    setState(changed);
    setStorageBySettings(changed);
  };

  useEffect(() => {
    // IndexedDB에서 설정 로드
    getStorageBySettings().then((settings) => {
      setState(settings);
    });
  }, []);

  return (
    <div style={{
      width: '320px',
      height: '500px',
      backgroundColor: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* 헤더 */}
      <div style={{
        position: 'relative',
        backgroundColor: 'white',
        padding: '16px',
        borderBottom: '1px solid #f1f3f4'
      }}>
        <h1 style={{
          fontSize: '14px',
          fontWeight: '500',
          color: '#202124',
          margin: 0
        }}>
          실시간 트렌드 설정
        </h1>
        {/* 그라데이션 바 */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: '16px',
          right: '16px',
          height: '2px',
          background: 'linear-gradient(90deg, #4285f4 0%, #34a853 25%, #fbbc04 50%, #ea4335 75%, #9c27b0 100%)',
          borderRadius: '1px'
        }}></div>
      </div>

      <div style={{
        padding: '16px',
        height: 'calc(100% - 64px)',
        overflowY: 'auto'
      }}>
        {/* 사이트 설정 */}
        <div style={{marginBottom: '20px'}}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#202124',
            marginBottom: '12px',
            margin: 0
          }}>사이트 설정</h3>
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e1e5e9',
            borderRadius: '8px',
            padding: '12px'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px',
              marginBottom: '8px'
            }}>
              <input
                type="checkbox"
                name="naver"
                checked={state.naver}
                onChange={handleChange}
                style={{
                  width: '16px',
                  height: '16px',
                  marginRight: '12px'
                }}
              />
              <span style={{
                fontSize: '14px',
                color: '#202124',
                fontWeight: '500',
                flex: 1
              }}>네이버</span>
            </label>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px'
            }}>
              <input
                type="checkbox"
                name="google"
                checked={state.google}
                onChange={handleChange}
                style={{
                  width: '16px',
                  height: '16px',
                  marginRight: '12px'
                }}
              />
              <span style={{
                fontSize: '14px',
                color: '#202124',
                fontWeight: '500',
                flex: 1
              }}>구글</span>
            </label>
          </div>
        </div>

        {/* 위치 설정 */}
        <div style={{marginBottom: '20px'}}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#202124',
            marginBottom: '12px',
            margin: 0
          }}>위치 설정</h3>
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e1e5e9',
            borderRadius: '8px',
            padding: '12px'
          }}>
            <div style={{marginBottom: '16px'}}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '500',
                color: '#5f6368',
                marginBottom: '8px'
              }}>화면 위치</label>
              <select
                name="position"
                value={state.position}
                onChange={handleSelectChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '14px',
                  border: '1px solid #dadce0',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="bottom-right">오른쪽 하단</option>
                <option value="bottom-left">왼쪽 하단</option>
              </select>
            </div>

            <div style={{marginBottom: '16px'}}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '500',
                color: '#5f6368',
                marginBottom: '8px'
              }}>
                아래 여백: <span style={{fontWeight: '600', color: '#1a73e8'}}>{state.bottomOffset}px</span>
              </label>
              <input
                type="range"
                name="bottomOffset"
                min="10"
                max="100"
                value={state.bottomOffset}
                onChange={handleChange}
                className="slider"
                style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '4px',
                  appearance: 'none',
                  cursor: 'pointer'
                }}
              />
            </div>

            <div style={{marginBottom: '16px'}}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '500',
                color: '#5f6368',
                marginBottom: '8px'
              }}>
                옆 여백: <span style={{fontWeight: '600', color: '#1a73e8'}}>{state.sideOffset}px</span>
              </label>
              <input
                type="range"
                name="sideOffset"
                min="10"
                max="100"
                value={state.sideOffset}
                onChange={handleChange}
                className="slider"
                style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '4px',
                  appearance: 'none',
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>
        </div>

        {/* 투명도 설정 */}
        <div style={{marginBottom: '20px'}}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#202124',
            marginBottom: '12px',
            margin: 0
          }}>외관 설정</h3>
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e1e5e9',
            borderRadius: '8px',
            padding: '12px'
          }}>
            <div style={{marginBottom: '16px'}}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '500',
                color: state.allowClickBehindChart ? '#9ca3af' : '#5f6368',
                marginBottom: '8px'
              }}>
                기본 투명도: <span style={{fontWeight: '600', color: state.allowClickBehindChart ? '#9ca3af' : '#9c27b0'}}>{state.opacity}%</span>
                <span style={{color: '#80868b', marginLeft: '4px'}}>(0: 불투명, 70: 투명)</span>
              </label>
              <input
                type="range"
                name="opacity"
                min="0"
                max="70"
                step="5"
                value={state.opacity}
                onChange={handleChange}
                disabled={state.allowClickBehindChart}
                className="slider"
                style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: state.allowClickBehindChart ? '#f3f4f6' : '#e5e7eb',
                  borderRadius: '4px',
                  appearance: 'none',
                  cursor: state.allowClickBehindChart ? 'not-allowed' : 'pointer',
                  opacity: state.allowClickBehindChart ? 0.5 : 1
                }}
              />
            </div>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px'
            }}>
              <input
                type="checkbox"
                name="allowClickBehindChart"
                checked={state.allowClickBehindChart}
                onChange={handleChange}
                style={{
                  width: '16px',
                  height: '16px',
                  marginRight: '12px'
                }}
              />
              <div style={{flex: 1}}>
                <span style={{
                  fontSize: '14px',
                  color: '#202124',
                  fontWeight: '500',
                  display: 'block'
                }}>차트 뒤의 버튼 클릭 가능</span>
                <span style={{
                  fontSize: '11px',
                  color: '#80868b',
                  display: 'block',
                  marginTop: '2px'
                }}>설정 시 투명도 70%로 고정</span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

// React 앱을 DOM에 렌더링
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}
