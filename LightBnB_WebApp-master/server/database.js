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
const getAllReservations = function(guest_id, limit = 10) {
  // return getAllProperties(null, 2);

  const queryString = `
  SELECT *
  FROM reservations
  WHERE guest_id = $1
  AND start_date != NOW()
  LIMIT $2`;
  
  const values = [guest_id, limit];

  return pool.query(queryString, values)
  .then(res => {
    return res.rows;
  })
  .catch(err => {
    console.error('query error', err.stack);
  });

}
exports.getAllReservations = getAllReservations;

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
