const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});
/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  const queryString = `
  SELECT *
  FROM users
  WHERE email = $1`;

  const values = [email];

  return pool.query(queryString, values)
  .then(res => {
    let user = null;
    if (res.rows.length > 0) {
      user = res.rows[0];
    }
    // console.log(user);
    return user;
  })
  .catch(err => {
    console.error('NULL', err.stack);
  });
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  const queryString = `
  SELECT *
  FROM users
  WHERE id = $1`;

  const values = [id];

  return pool.query(queryString, values)
  .then(res => {
    let user = null;
    if (res.rows.length > 0) {
      user = res.rows[0];
    }
    // console.log(user);
    return user;
  })
  .catch(err => {
  console.error('NULL', err.stack);
  });
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  const userName = user.name;
  const userEmail = user.email;
  const userPass = user.password;
  
  const queryString = `
  INSERT INTO users (name, email, password)
  VALUES ($1, $2, $3)
  RETURNING *`;

  const values = [userName, userEmail, userPass];

  return pool.query(queryString, values)
  .then(res => {
    return res.rows[0];
  })
  .catch(err => {
    console.error('query error', err.stack);
  });
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getFulfilledReservations = function(guest_id, limit = 10) {
  // return getAllProperties(null, 2);

  const queryString = `
  SELECT properties.*, reservations.*, avg(rating) as average_rating
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON properties.id = property_reviews.property_id 
  WHERE reservations.guest_id = $1
  AND reservations.end_date < now()::date
  GROUP BY properties.id, reservations.id
  ORDER BY reservations.start_date
  LIMIT $2;`;
  
  const values = [guest_id, limit];

  return pool.query(queryString, values)
  .then(res => {
    return res.rows;
  })
  .catch(err => {
    console.error('query error', err.stack);
  });

}
exports.getFulfilledReservations = getFulfilledReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
  
  // 1
  const queryParams = [];
  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;
  // 3
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }

  if (options.owner_id) {
    queryParams.push(options.owner_id);
    if (queryParams.length === 1) {
      queryString += `WHERE properties.owner_id = $${queryParams.length} `;
    } else {
      queryString += `AND properties.owner_id = $${queryParams.length} `;
    }
  }

  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    queryParams.push(options.minimum_price_per_night * 100, options.maximum_price_per_night * 100);
    if (queryParams.length === 2) {
      queryString += `WHERE cost_per_night >= $${queryParams.length-1} AND cost_per_night <= $${queryParams.length}`;
    } else {
      queryString += `AND cost_per_night >= $${queryParams.length-1} AND cost_per_night <= $${queryParams.length}`;
    }
  }

  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating)
      if (queryParams.length === 3) {
        queryString += `AND property_reviews.rating >= $${queryParams.length}`;
    } else {
      queryString += `WHERE property_reviews.rating >= $${queryParams.length}`;
    }
  }
  // 4
  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;
  // 5
  console.log(queryString, queryParams);
  // 6
  return pool.query(queryString, queryParams).then((res) => res.rows);

};
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const ownerId = property.owner_id;
  const title = property.title;
  const desc = property.description;
  const thumbPhoto = property.thumbnail_photo_url;
  const coverPhoto = property.cover_photo_url;
  const nightCost = property.cost_per_night;
  const st = property.street;
  const city = property.city;
  const prov = property.province;
  const pcode = property.post_code;
  const con = property.country;
  const parking = property.parking_spaces;
  const bath = property.number_of_bathrooms;
  const bed = property.number_of_bedrooms;

  const queryString = `
  INSERT INTO properties (owner_id, title, description, thumbnail_photo_url,
    cover_photo_url, cost_per_night, street, city, province, post_code,
    country, parking_spaces, number_of_bathrooms, number_of_bedrooms)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  RETURNING *`;
  
  const values = [ownerId, title, desc, thumbPhoto, coverPhoto, nightCost, st, city, prov, pcode, con, parking, bath, bed];

  return pool.query(queryString, values)
  .then(res => {
    return res.rows[0];
  })
  .catch(err => {
    console.error('query error', err.stack);
  });
}
exports.addProperty = addProperty;


const addReservation = function(reservation) {
  /*
   * Adds a reservation from a specific user to the database
   */
  return pool.query(`
  INSERT INTO reservations (start_date, end_date, property_id, guest_id)
  VALUES ($1, $2, $3, $4) RETURNING *;
  `, [reservation.start_date, reservation.end_date, reservation.property_id, reservation.guest_id])
  .then(res => res.rows[0])
}
exports.addReservation = addReservation;

//
//  Gets upcoming reservations
//
const getUpcomingReservations = function(guest_id, limit = 10) {
  
  const queryString = `
  SELECT properties.*, reservations.*, avg(rating) as average_rating
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON properties.id = property_reviews.property_id 
  WHERE reservations.guest_id = $1
  AND reservations.start_date > now()::date
  GROUP BY properties.id, reservations.id
  ORDER BY reservations.start_date
  LIMIT $2;`;
  
  const values = [guest_id, limit];

  return pool.query(queryString, values)
  .then(res => {
    return res.rows;
  })
  .catch(err => {
    console.error('query error', err.stack);
  });
}
exports.getUpcomingReservations = getUpcomingReservations;

//
//  Updates an existing reservation with new information
//
const updateReservation = function(reservationData) {
  // base string
  let queryString = `UPDATE reservations SET `;
  const queryParams = [];
  if (reservationData.start_date) {
    queryParams.push(reservationData.start_date);
    queryString += `start_date = $1`;
    if (reservationData.end_date) {
      queryParams.push(reservationData.end_date);
      queryString += `, end_date = $2`;
    }
  } else {
    queryParams.push(reservationData.end_date);
    queryString += `end_date = $1`;
  }
  queryString += ` WHERE id = $${queryParams.length + 1} RETURNING *;`
  queryParams.push(reservationData.reservation_id);
  console.log(queryString);
  return pool.query(queryString, queryParams)
    .then(res => res.rows[0])
    .catch(err => console.error(err));
}
exports.updateReservation = updateReservation;

//
//  Deletes an existing reservation
//
const deleteReservation = function(reservationId) {
  const values = [reservationId];
  const queryString = `DELETE FROM reservations WHERE id = $1`;
  return pool.query(queryString, values)
    .then(() => console.log("Successfully deleted!"))
    .catch(() => console.error(err));
}
exports.deleteReservation = deleteReservation;


const getIndividualReservation = function(reservationId) {
  
  const queryString = `
  SELECT *
  FROM reservations
  WHERE reservations.id = $1`

const values = [reservationId];

return pool.query(queryString, values)
  .then(res => {
    return res.rows;
  })
  .catch(err => {
    console.error('query error', err.stack);
  });
}
exports.getIndividualReservation = getIndividualReservation;