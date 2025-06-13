package database

import (
	"context"
	"database/sql"
	"io"
	"os"
)

var (
	migrationFilePath = "./internal/database/init.sql"
)

func migrate(db *sql.DB) error {
	f, err := os.Open(migrationFilePath)
	if err != nil {
		return err
	}

	contents, err := io.ReadAll(f)
	if err != nil {
		return err
	}
	// run migration in a transaction
	tx, err := db.BeginTx(context.Background(), &sql.TxOptions{Isolation: sql.LevelReadCommitted})
	if err != nil {
		return err
	}
	_, err = tx.Exec(string(contents))
	if err != nil {
		tx.Rollback()
		return err
	}
	return tx.Commit()
}
