# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [1.8.0] - 2025-01-20

### Changed
- **Environment Variable Separation**: Separated `.env` configuration into frontend-specific (`ecommanager/.env`) and backend-specific (`ecommanager/server/.env`) files for better organization and security.
  - Frontend now uses `VITE_API_URL` instead of `REACT_APP_API_URL` for Vite compatibility
  - Backend maintains its own `.env` file in the `server/` directory
  - Created separate `.env.example` templates for both frontend and backend
  - Updated `apiClient.ts` to use `import.meta.env.VITE_API_URL` instead of `process.env.REACT_APP_API_URL`

### Added
- **Environment Documentation**: Created comprehensive environment setup guides:
  - `ENV_SETUP.md` - Detailed environment variable configuration guide
  - `SETUP_INSTRUCTIONS.txt` - Quick start guide for setting up environment files
  - `server/.env.example` - Backend environment variable template
  
### Fixed
- **API Connection Issues**: Fixed "failed to fetch data" errors caused by inconsistent environment variable naming between `api.ts` and `apiClient.ts`
- **Environment Variable Loading**: Corrected backend `.env` path loading in `server/src/index.ts` to properly load from `server/.env`

## [1.7.0] - 2023-11-01

### Fixed
- **Shopify Feature Compatibility**: Fixed a critical bug where the application would throw "Invalid URL" and "Could not fetch categories" errors for Shopify stores. The system now correctly identifies the platform and displays a user-friendly "Feature Not Available" message for Shopify-specific functions that are not yet implemented (e.g., Order Viewer, Product/Category Management), preventing crashes and improving user experience.

## [1.6.0] - 2023-10-31

### Fixed
- **Deletion Functionality**: Resolved issues where the single-item delete buttons for both products and categories were not working correctly. The API calls have been reinforced for greater reliability.

### Added
- **Bulk Selection & Deletion**: Implemented bulk actions for both products and categories. Users can now select multiple items using checkboxes and delete them in a single operation via a contextual action bar.
- **Category Search**: Added a search bar to the Category Manager, allowing users to quickly filter categories while maintaining the hierarchical view.
- **Category Pagination**: Introduced pagination to the Category Manager, displaying up to 20 top-level categories per page with navigation controls to improve performance and usability with large datasets.

## [1.5.0] - 2023-10-30

### Added
- **User Role and Website Limit Management**:
  - Administrators can now assign roles ('admin' or 'user') to users.
  - A "Maximum Websites" limit can be set for each user, controlling how many WooCommerce sites they can configure.
  - The user management table now displays the number of websites a user has configured versus their allowed maximum.
  - The application now prevents users from adding more websites once their limit is reached.

## [1.4.0] - 2023-10-29

### Fixed
- **Product Stock Not Updating**: Resolved an issue where the stock quantity was not being saved correctly when creating or editing a product. The `manage_stock` flag is now correctly set in the API payload.
- **Duplicate Product Categories**: Fixed a bug causing duplicate entries in the category selection dropdown by implementing proper pagination and deduplication when fetching categories from WooCommerce.

### Added
- **Product Category Management**:
  - Added a category filter dropdown to the product list view.
  - Implemented the ability to assign a category to a product via a dropdown in the create/edit form.
  - The product table now displays the categories for each product.
- **Enhanced Product Management**: 
  - Product images are now displayed in the product list for easier identification.
  - Added fields to create and edit product `descriptions` and `short descriptions`.
  - Added the ability to set a product's main image by providing a URL in the product form.
- **Product Management**: Added a new "Products" section for admins to perform CRUD (Create, Read, Update, Delete) operations on products for any user's connected WooCommerce website. This allows for direct management of product listings within the application.

## [1.3.0] - 2023-10-28

### Added
- Created the `changelogs.md` file to track application updates.

## [1.2.0] - 2023-10-27

### Changed
- **Streamlined Order Viewing Experience**: Refactored the "View Orders" page for both admins and users. Instead of a multi-step process, a dropdown menu is now available directly on the orders page to switch between different websites. This simplifies the workflow and reduces clicks.

## [1.1.1] - 2023-10-27

### Fixed
- **Logout Issue with Auto-Login**: Resolved a bug where users could not log out when the "Auto-login as Admin" setting was active. A session-based flag now prevents auto-login after a manual logout, ensuring the logout action is respected for the duration of the session.

## [1.1.0] - 2023-10-27

### Fixed
- **Website Form Type Mismatch**: Corrected an issue in the `WebsiteForm` component where the `is_primary` property was missing from the component's state, causing a type mismatch during save operations.

## [1.0.0] - 2023-10-26

### Added
- Initial release of the GargDastak Stock Processor Advanced application.
- Core features include:
  - User authentication (Admin and User roles).
  - Excel file processing workflow for stock reports.
  - Data preview and CSV export.
  - Synchronization with WooCommerce stores.
  - Admin dashboard for user management, workflow configuration, and database exploration.
  - User dashboard for processing files, viewing sync history, and managing settings.