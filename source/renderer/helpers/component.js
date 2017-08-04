import {PureComponent} from 'react';

export default class Component extends PureComponent {

  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
  }

  onChange(field, value) {
    return (event) => {
      if(value === undefined) {
        if(event && event.target) {
          const target = event.target;
          value = target.type === 'checkbox' ? target.checked : target.value;
        } else {
          value = event;
        }
      }

      const update = new Object();

      if(field === Object(field)) {
        for (const key in field) {
          if (field.hasOwnProperty(key)) {
            update[key] = {...this.state[key], [field[key]]: value};
          }
        }
      } else {
        update[field] = value;
      }
      this.setState(update);
    };
  }
}
