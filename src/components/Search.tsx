import debounce from 'lodash-es/debounce';
import React, { useCallback, useMemo, useState } from 'react';

import { DispatchFn } from '$src/store/types';

import s0 from './Search.module.scss';

function RuleSearch({
  dispatch,
  searchText,
  updateSearchText,
}: {
  dispatch: DispatchFn;
  searchText: string;
  updateSearchText: (x: string) => any;
}) {
  const [text, setText] = useState(searchText);
  const updateSearchTextInternal = useCallback(
    (v: string) => {
      dispatch(updateSearchText(v));
    },
    [dispatch, updateSearchText],
  );
  const updateSearchTextDebounced = useMemo(
    () => debounce(updateSearchTextInternal, 300),
    [updateSearchTextInternal],
  );
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    updateSearchTextDebounced(e.target.value);
  };

  return (
    <div className={s0.RuleSearch}>
      <div className="unified-search-container">
        <input 
          type="text" 
          value={text} 
          onChange={onChange} 
          className="unified-search-input"
          placeholder="Search rules..."
        />
      </div>
    </div>
  );
}

export default RuleSearch;
