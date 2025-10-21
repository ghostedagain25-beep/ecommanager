import React from 'react';
import { ExclamationIcon } from '../ui/icons';

export const ShopifyGuide: React.FC = () => {
  return (
    <article className="prose prose-invert prose-lg max-w-none text-gray-300">
      <h2 className="text-sky-400">Connecting Your Shopify Store</h2>
      <p>
        To connect your Shopify store, you need to create a custom app and generate an Admin API
        access token. This token allows the application to securely access and update your product
        information.
      </p>

      <h3>Step-by-Step Instructions</h3>
      <ol>
        <li>
          <strong>Log in to your Shopify Admin Dashboard.</strong>
        </li>
        <li>
          Navigate to <code className="text-sky-300">Settings</code> at the bottom-left of the page,
          then go to <code className="text-sky-300">Apps and sales channels</code>.
        </li>
        <li>
          Click on <code className="text-sky-300">Develop apps</code>. If this is your first time,
          you may need to click <code className="text-sky-300">Allow custom app development</code>.
        </li>
        <li>
          Click the <code className="text-sky-300">Create an app</code> button.
        </li>
        <li>Give your app a name, for example, "StockPro Sync", and select an App developer.</li>
        <li>
          After creating the app, go to the <code className="text-sky-300">Configuration</code> tab.
        </li>
        <li>
          In the "Admin API integration" section, click{' '}
          <code className="text-sky-300">Configure</code>.
        </li>
        <li>
          You must grant this app permissions (scopes) to access your store data. Scroll down and
          check the following scopes:
          <ul>
            <li>
              <strong className="text-green-400">write_products</strong>
            </li>
            <li>
              <strong className="text-green-400">read_products</strong>
            </li>
          </ul>
          <p className="text-sm">
            These permissions are required to read your products' SKUs and update their price and
            stock information.
          </p>
        </li>
        <li>
          Click <code className="text-sky-300">Save</code> at the top of the page.
        </li>
        <li>
          Now navigate to the <code className="text-sky-300">API credentials</code> tab.
        </li>
        <li>
          Click the <code className="text-sky-300">Install app</code> button and confirm the
          installation.
        </li>
      </ol>

      <div className="my-6 p-4 bg-yellow-900/50 border border-yellow-700 rounded-md text-yellow-300 not-prose flex items-start gap-3">
        <ExclamationIcon className="w-6 h-6 flex-shrink-0 mt-1" />
        <div>
          <h4 className="font-bold">Important: Reveal and Copy Your Token</h4>
          <p className="text-sm">
            After installing, you will see an{' '}
            <strong className="text-yellow-400">Admin API access token</strong> section. Click{' '}
            <code className="text-sky-300">Reveal token once</code>. This token will{' '}
            <strong className="font-bold">only be shown once</strong>. Copy it immediately and store
            it securely.
          </p>
        </div>
      </div>

      <h3>Adding Credentials to the App</h3>
      <p>
        Go to the <code className="text-sky-300">Settings</code> page in this application. Add a new
        website (or edit an existing one) and select "Shopify" as the platform.
        <ul>
          <li>
            <strong>Shopify Store Name:</strong> This is the unique handle of your store (e.g., if
            your URL is `my-awesome-store.myshopify.com`, your store name is `my-awesome-store`).
          </li>
          <li>
            <strong>Admin API Access Token:</strong> Paste the token you copied from your Shopify
            custom app here.
          </li>
        </ul>
      </p>
    </article>
  );
};
