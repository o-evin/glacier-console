import {
  AUTH_SIGNIN_REQUEST,
  AUTH_SIGNIN_SUCCESS,
  AUTH_SIGNIN_FAILURE,
  AUTH_SIGNOUT_SUCCESS,
} from '../../../contracts/enums/action_types';

const initialState = {
  isAuthenticated: false,
};

export default function(state = initialState, action) {
  switch (action.type) {
    case AUTH_SIGNIN_REQUEST:
      return {
        ...state,
        aws: action.auth,
        isAuthenticated: false,
      };
    case AUTH_SIGNIN_SUCCESS:
      return {
        ...state,
        aws: action.auth,
        isAuthenticated: true,
      };
    case AUTH_SIGNIN_FAILURE:
    case AUTH_SIGNOUT_SUCCESS:
      return {
        ...state,
        aws: null,
        isAuthenticated: false,
      };
    default:
      return state;
  }
}
