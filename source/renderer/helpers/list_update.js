import {isEqual} from 'lodash';

export default function listUpdate(list = [], entry) {
  return Array.isArray(entry) ? arrayUpdate(list, entry) :
    itemUpdate(list, entry);
}

export function arrayUpdate(source = [], updates, replace) {
  return updates.reduce((array, value) => {
    const current = array.find(item => item.id === value.id);
    array.push(isEqual(value, current) ? current : value);
    return array;
  }, []);
}

export function itemUpdate(array = [], value) {
  const current = array.find(item => item.id === value.id);

  if (isEqual(value, current)) {
    return array;
  }

  return [
    value,
    ...array.filter(item => item !== current),
  ];
}
