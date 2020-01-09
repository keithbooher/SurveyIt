import axios from 'axios'
import { FETCH_USER } from './types'

// This is an action creator
export const fetchUser = () => async dispatch => {
  const res = await axios.get('/api/current_user')
  dispatch({ type: FETCH_USER, payload: res.data })
}


// THE ABOVE TRANSLATES TO THIS
// export const fetchUser = () => {
//   // when redux thunk sees a function returned instead of an action, it will
//   // automatically call this function and pass in the dispatch function

//   // useful because we can make the axios/ajax request. After the request has been 
//   // successfully completed THEN we dispatch the action.

//   return function(dispatch) {
//     axios.get('/api/current_user')
//       .then(res => dispatch({ type: FETCH_USER, payload: res }))
//   }
// }

// Handle payment token
export const handleToken = (token) => async dispatch => {
  const res = await axios.post('/api/stripe', token)

  dispatch({ type: FETCH_USER, payload: res.data })
}