SELECT city, COUNT(reservations.*) AS total_reservations
FROM properties
JOIN reservations ON reservations.property_id = properties.id
GROUP BY city
ORDER By total_reservations DESC;