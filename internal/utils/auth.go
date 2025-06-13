package utils

import "golang.org/x/crypto/bcrypt"

// HashPassword creates a bcrypt hash of a plain-text password
func HashPassword(password string) (string, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashed), err
}

// VerifyPassword checks if the hashed and plain-text password matches
func VerifyPassword(hashed, plain string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashed), []byte(plain))
}
