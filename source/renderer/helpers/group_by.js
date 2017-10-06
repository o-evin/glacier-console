import {isString} from 'lodash';

export default function groupBy(array, criterion) {
  const [key] = Object.keys(criterion);
  const values = Object.values(criterion[key]).filter(isString);

  const group = new Map(values.map(item => [item, []]));

  return array.reduce((target, value) => {
    target.get(value[key]).push(value);
    return target;
  }, group);
}
