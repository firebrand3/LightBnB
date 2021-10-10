SELECT reservations.*, properties.*, AVG(property_reviews.rating) AS average_rating
FROM reservations
JOIN property_reviews ON property_reviews.reservation_id = reservations.id
JOIN properties ON reservations.property_id = properties.id
WHERE reservations.end_date < now()::DATE
AND reservations.guest_id = 1
GROUP BY reservations.id, properties.id
ORDER BY reservations.start_date DESC
LIMIT 10;