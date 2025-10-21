import React from 'react';
import { ExclamationIcon } from '../ui/icons';

export const WordPressGuide: React.FC = () => {
  return (
    <article className="prose prose-invert prose-lg max-w-none text-gray-300">
      <h2 className="text-sky-400">Connecting Your WordPress (WooCommerce) Store</h2>
      <p>
        To allow this application to sync with your WooCommerce store, you need to generate REST API
        keys. These keys act like a username and password that grant the application access to read
        and update your product data.
      </p>

      <h3>Step-by-Step Instructions</h3>
      <ol>
        <li>
          <strong>Log in to your WordPress Admin Dashboard.</strong>
        </li>
        <li>
          Navigate to <code className="text-sky-300">WooCommerce &gt; Settings</code> from the
          left-hand menu.
        </li>
        <li>
          Go to the <code className="text-sky-300">Advanced</code> tab, and then click on{' '}
          <code className="text-sky-300">REST API</code>.
        </li>
        <li>
          Click the <code className="text-sky-300">Add key</code> or{' '}
          <code className="text-sky-300">Create an API key</code> button.
        </li>
        <li>
          On the Key Details screen, fill in the following:
          <ul>
            <li>
              <strong>Description:</strong> Give the key a recognizable name, like "StockPro App".
            </li>
            <li>
              <strong>User:</strong> Select your admin user account.
            </li>
            <li>
              <strong>Permissions:</strong> This is the most important step. Set the permissions to{' '}
              <strong className="text-green-400">Read/Write</strong>. This is required to update
              stock levels and prices.
            </li>
          </ul>
        </li>
        <li>
          Click the <code className="text-sky-300">Generate API key</code> button.
        </li>
        <li>
          You will now see your <strong className="text-yellow-400">Consumer Key</strong> and{' '}
          <strong className="text-yellow-400">Consumer Secret</strong>.
        </li>
      </ol>

      <div className="my-6 p-4 bg-yellow-900/50 border border-yellow-700 rounded-md text-yellow-300 not-prose flex items-start gap-3">
        <ExclamationIcon className="w-6 h-6 flex-shrink-0 mt-1" />
        <div>
          <h4 className="font-bold">Important: Copy Your Keys Now</h4>
          <p className="text-sm">
            WooCommerce will only show you the Consumer Secret{' '}
            <strong className="font-bold">one time</strong>. Copy both keys and store them somewhere
            safe immediately. If you lose them, you will need to generate a new key pair.
          </p>
        </div>
      </div>

      <h3>Adding Credentials to the App</h3>
      <p>
        Once you have your keys, go to the <code className="text-sky-300">Settings</code> page in
        this application. Add a new website (or edit an existing one) and paste the{' '}
        <strong className="text-yellow-400">Consumer Key</strong> and{' '}
        <strong className="text-yellow-400">Consumer Secret</strong> into the corresponding fields.
      </p>

      <h3>Troubleshooting</h3>
      <p>
        If you receive a "Network request failed" or CORS error, it means your website's server is
        blocking requests from this application. You may need to contact your hosting provider or a
        developer to adjust your server's{' '}
        <code className="text-sky-300">Cross-Origin Resource Sharing (CORS)</code> policy to allow
        requests from the domain this application is running on.
      </p>
    </article>
  );
};
