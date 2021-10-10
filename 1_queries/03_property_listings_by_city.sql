SELECT properties.id, title, cost_per_night, AVG(property_reviews.rating) AS average_rating
FROM properties
JOIN property_reviews ON property_reviews.property_id = properties.id
WHERE properties.city = 'Vancouver'
AND rating >= 4
GROUP BY properties.id
ORDER BY cost_per_night ASC
LIMIT 10;