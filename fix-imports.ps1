# PowerShell script to fix all import paths after refactoring

$files = @(
    "src\features\auth\screens\LoginScreen.tsx",
    "src\features\auth\screens\SignupScreen.tsx",
    "src\features\auth\services\authService.ts",
    "src\features\dishes\screens\DashboardScreen.tsx",
    "src\features\dishes\screens\AddDishScreen.tsx",
    "src\features\dishes\screens\EditDishScreen.tsx",
    "src\features\dishes\services\dishService.ts",
    "src\features\dishes\services\uploadService.ts",
    "src\features\profile\screens\ProfileScreen.tsx",
    "src\features\qr\screens\QRScreen.tsx",
    "src\components\common\Button\Button.tsx",
    "src\components\common\Input\Input.tsx",
    "src\components\dish\DishCard\DishCard.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        # Fix imports
        $content = $content -replace "from '../config/appwrite'", "from '../../../api/client/appwrite'"
        $content = $content -replace "from '../services/authService'", "from '../../auth/services/authService'"
        $content = $content -replace "from '../services/dishService'", "from '../services/dishService'"
        $content = $content -replace "from '../services/uploadService'", "from '../services/uploadService'"
        $content = $content -replace "from '../types/navigation'", "from '../../../types/navigation'"
        $content = $content -replace "from '../types'", "from '../../../types'"
        $content = $content -replace "from '../components/", "from '../../../components/"
        
        Set-Content -Path $file -Value $content -NoNewline
        Write-Host "Fixed: $file"
    }
}

Write-Host "Done!"
