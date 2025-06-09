import { useAtom } from 'jotai';
import * as React from 'react';
import { useTextInput } from 'src/hooks/useTextInput';

import { TextAtom } from '$src/store/rules';


const { useCallback } = React;

export function TextFilter(props: { textAtom: TextAtom; placeholder?: string }) {
  const [onChange, text] = useTextInput(props.textAtom);
  const [, setTextGlobal] = useAtom(props.textAtom);
  
  const clearSearch = useCallback(() => {
    setTextGlobal('');
  }, [setTextGlobal]);
  
  return (
    <div className="unified-search-container">
    <input
      className="unified-search-input"
      type="text"
      value={text}
      onChange={onChange}
      placeholder={props.placeholder}
    />
      {text && (
        <button
          className="unified-search-clear"
          onClick={clearSearch}
          type="button"
          title="Clear search"
        >
          <i className="ti ti-x"></i>
        </button>
      )}
    </div>
  );
}
