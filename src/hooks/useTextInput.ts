import { PrimitiveAtom, useAtom } from 'jotai';
import debounce from 'lodash-es/debounce';
import * as React from 'react';

const { useCallback, useState, useMemo } = React;

export function useTextInput(
  x: PrimitiveAtom<string>,
): [(e: React.ChangeEvent<HTMLInputElement>) => void, string] {
  const [globalText, setTextGlobal] = useAtom(x);
  const [text, setText] = useState(globalText);
  
  // 同步全局状态到本地状态
  React.useEffect(() => {
    setText(globalText);
  }, [globalText]);
  
  const setTextDebounced = useMemo(() => debounce(setTextGlobal, 300), [setTextGlobal]);
  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setText(e.target.value);
      setTextDebounced(e.target.value);
    },
    [setTextDebounced],
  );
  return [onChange, text];
}
