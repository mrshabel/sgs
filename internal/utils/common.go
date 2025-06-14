package utils

import "fmt"

var (
	StorageUnits = []string{"", "K", "M", "G", "T"}
)

// FormatStorageSize formats the input storage size to its highest format
func FormatStorageSize(size int64) string {
	var ptr int
	decimalSize := float64(size)

	// move pointer until size is lesser than 1 and storage is in highest unit
	for decimalSize/1024 > 1 && ptr < len(StorageUnits)-1 {
		ptr++
		decimalSize /= 1024
	}

	return fmt.Sprintf("%.2f %sB", decimalSize, StorageUnits[ptr])
}
