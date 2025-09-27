<template>
  <div class="about-page py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 transition-colors">
    <div class="max-w-3xl mx-auto">
      <h1 class="text-3xl font-extrabold text-gray-900 dark:text-white text-center">About This Application</h1>
      <p class="mt-4 text-lg text-gray-600 dark:text-gray-300 text-center">
        This is a real-time video calling application built with Vue.js and Django.
      </p>

      <div class="mt-10 prose prose-lg dark:prose-invert text-gray-600 dark:text-gray-300 mx-auto">
        <h2>Features</h2>
        <ul>
          <li>Real-time video and audio communication</li>
          <li>Create and join rooms with short codes</li>
          <li>User authentication</li>
          <li>Room history</li>
          <li>Localization (multiple languages)</li>
          <li>Dark mode</li>
        </ul>

        <h2>Technologies Used</h2>
        <h3>Frontend</h3>
        <ul>
          <li>Vue.js 3 (with Composition API)</li>
          <li>Vue Router for routing</li>
          <li>Pinia for state management</li>
          <li>Tailwind CSS for styling</li>
          <li>Vite for frontend tooling</li>
          <li>WebRTC for real-time communication</li>
        </ul>

        <h3>Backend</h3>
        <ul>
          <li>Django 4</li>
          <li>Django Channels for WebSocket support</li>
          <li>Django REST Framework for APIs</li>
          <li>PostgreSQL for the database</li>
          <li>Redis for caching and message queuing</li>
        </ul>
      </div>
    </div>
  </div>
</template>
