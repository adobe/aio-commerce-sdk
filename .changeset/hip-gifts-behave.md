---
"@adobe/aio-commerce-lib-events": minor
---

Create library and introduce the following API operations:

**For Adobe I/O Events**

<table>
    <thead>
        <tr>
            <th>Category</th>
            <th>Operation</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td rowspan="3"><strong>Event Providers</strong></td>
            <td><code>getAllEventProviders</code></td>
            <td>Retrieves all event providers</td>
        </tr>
        <tr>
            <td><code>getEventProviderById</code></td>
            <td>Retrieves a specific event provider by ID</td>
        </tr>
        <tr>
            <td><code>createEventProvider</code></td>
            <td>Creates a new event provider</td>
        </tr>
        <tr>
            <td rowspan="4"><strong>Event Providers (Shortcuts)</strong></td>
            <td><code>getAllCommerceEventProviders</code></td>
            <td>Shorthand for getting all Commerce event providers</td>
        </tr>
        <tr>
            <td><code>getAll3rdPartyCustomEventsProviders</code></td>
            <td>Shorthand for getting all 3rd party custom event providers</td>
        </tr>
        <tr>
            <td><code>createCommerceProvider</code></td>
            <td>Shorthand for creating a Commerce provider</td>
        </tr>
        <tr>
            <td><code>create3rdPartyCustomEventsProvider</code></td>
            <td>Shorthand for creating a 3rd party custom events provider</td>
        </tr>
        <tr>
            <td rowspan="3"><strong>Event Metadata</strong></td>
            <td><code>getAllEventMetadataForProvider</code></td>
            <td>Retrieves all event metadata for a provider</td>
        </tr>
        <tr>
            <td><code>getEventMetadataForEventAndProvider</code></td>
            <td>Retrieves event metadata for a specific event and provider</td>
        </tr>
        <tr>
            <td><code>createEventMetadataForProvider</code></td>
            <td>Creates event metadata for a provider</td>
        </tr>
    </tbody>
</table>

**For Adobe Commerce**

<table>
    <thead>
        <tr>
            <th>Category</th>
            <th>Operation</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td rowspan="3"><strong>Event Providers</strong></td>
            <td><code>getAllEventProviders</code></td>
            <td>Retrieves all event providers</td>
        </tr>
        <tr>
            <td><code>getEventProviderById</code></td>
            <td>Retrieves a specific event provider by ID</td>
        </tr>
        <tr>
            <td><code>createEventProvider</code></td>
            <td>Creates a new event provider</td>
        </tr>
        <tr>
            <td rowspan="2"><strong>Event Subscriptions</strong></td>
            <td><code>getAllEventSubscriptions</code></td>
            <td>Retrieves all event subscriptions</td>
        </tr>
        <tr>
            <td><code>createEventSubscription</code></td>
            <td>Creates a new event subscription</td>
        </tr>
        <tr>
            <td><strong>Eventing Configuration</strong></td>
            <td><code>updateEventingConfiguration</code></td>
            <td>Updates the eventing configuration</td>
        </tr>
    </tbody>
</table>
