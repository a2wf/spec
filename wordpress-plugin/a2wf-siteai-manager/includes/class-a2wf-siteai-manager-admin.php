<?php

if (! defined('ABSPATH')) {
    exit;
}

class A2WF_SiteAI_Manager_Admin {
    private $settings;
    private $generator;

    private $permission_labels = array(
        'read' => array(
            'productCatalog' => 'Product Catalog',
            'pricing' => 'Pricing',
            'availability' => 'Availability',
            'openingHours' => 'Opening Hours',
            'contactInfo' => 'Contact Info',
            'reviews' => 'Reviews',
            'faq' => 'FAQ',
            'companyInfo' => 'Company Info',
        ),
        'action' => array(
            'search' => 'Search',
            'addToCart' => 'Add to Cart',
            'checkout' => 'Checkout',
            'createAccount' => 'Create Account',
            'submitReview' => 'Submit Review',
            'submitContactForm' => 'Submit Contact Form',
            'bookAppointment' => 'Book Appointment',
            'cancelOrder' => 'Cancel Order',
            'requestRefund' => 'Request Refund',
        ),
        'data' => array(
            'customerRecords' => 'Customer Records',
            'orderHistory' => 'Order History',
            'paymentInfo' => 'Payment Info',
            'internalAnalytics' => 'Internal Analytics',
            'employeeData' => 'Employee Data',
        ),
    );

    public function __construct($settings, $generator) {
        $this->settings = $settings;
        $this->generator = $generator;

        add_action('admin_menu', array($this, 'register_menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_assets'));
        add_action('admin_post_a2wf_siteai_save', array($this, 'handle_save'));
    }

    public function register_menu() {
        add_menu_page(
            'A2WF SiteAI',
            'A2WF SiteAI',
            'manage_options',
            'a2wf-siteai-manager',
            array($this, 'render_page'),
            'dashicons-superhero-alt',
            65
        );
    }

    public function enqueue_assets($hook) {
        if ('toplevel_page_a2wf-siteai-manager' !== $hook) {
            return;
        }

        wp_enqueue_style('a2wf-siteai-manager', A2WF_SITEAI_MANAGER_URL . 'assets/css/admin.css', array(), A2WF_SITEAI_MANAGER_VERSION);
        wp_enqueue_script('a2wf-siteai-manager', A2WF_SITEAI_MANAGER_URL . 'assets/js/admin.js', array(), A2WF_SITEAI_MANAGER_VERSION, true);
    }

    public function handle_save() {
        if (! current_user_can('manage_options')) {
            wp_die(esc_html__('Insufficient permissions.', 'a2wf-siteai-manager'));
        }

        check_admin_referer('a2wf_siteai_save');

        $payload = isset($_POST['a2wf']) ? wp_unslash($_POST['a2wf']) : array();
        $result = $this->settings->update($payload);
        $errors = isset($result['errors']) && is_array($result['errors']) ? $result['errors'] : array();

        if (! empty($errors)) {
            $this->settings->set_admin_notice(
                'warning',
                'Konfiguration gespeichert. Einzelne JSON-Blöcke waren ungültig und wurden verworfen.',
                $errors
            );
        } else {
            $this->settings->set_admin_notice('success', 'siteai.json-Konfiguration gespeichert.');
        }

        wp_safe_redirect(add_query_arg(array(
            'page' => 'a2wf-siteai-manager',
            'updated' => 1,
        ), admin_url('admin.php')));
        exit;
    }

    public function render_page() {
        if (! current_user_can('manage_options')) {
            wp_die(esc_html__('Insufficient permissions.', 'a2wf-siteai-manager'));
        }

        $settings = $this->settings->get_all();
        $json = $this->generator->get_pretty_json();
        $tab = isset($_GET['tab']) ? sanitize_key($_GET['tab']) : 'core';
        $allowed_tabs = array('core', 'extensions', 'preview');

        if (! in_array($tab, $allowed_tabs, true)) {
            $tab = 'core';
        }

        $notice = $this->settings->get_admin_notice();
        ?>
        <div class="wrap a2wf-admin-wrap">
            <h1>A2WF SiteAI Manager</h1>
            <p class="description">Pflegt <code>siteai.json</code> für A2WF Core und optionale Site-Description-Extensions an einem Ort.</p>

            <?php if ($notice) : ?>
                <div class="notice notice-<?php echo esc_attr($this->normalize_notice_type($notice['type'])); ?> is-dismissible">
                    <p><?php echo esc_html($notice['message']); ?></p>
                    <?php if (! empty($notice['details'])) : ?>
                        <ul>
                            <?php foreach ($notice['details'] as $detail) : ?>
                                <li><?php echo esc_html($detail); ?></li>
                            <?php endforeach; ?>
                        </ul>
                    <?php endif; ?>
                </div>
            <?php endif; ?>

            <div class="a2wf-top-actions">
                <a class="button button-secondary" href="<?php echo esc_url(home_url('/siteai.json')); ?>" target="_blank" rel="noopener noreferrer">siteai.json öffnen</a>
                <button type="button" class="button button-secondary" data-a2wf-copy="#a2wf-json-preview">JSON kopieren</button>
            </div>

            <nav class="nav-tab-wrapper">
                <a href="<?php echo esc_url(admin_url('admin.php?page=a2wf-siteai-manager&tab=core')); ?>" class="nav-tab <?php echo esc_attr('core' === $tab ? 'nav-tab-active' : ''); ?>">Core Governance</a>
                <a href="<?php echo esc_url(admin_url('admin.php?page=a2wf-siteai-manager&tab=extensions')); ?>" class="nav-tab <?php echo esc_attr('extensions' === $tab ? 'nav-tab-active' : ''); ?>">Extensions</a>
                <a href="<?php echo esc_url(admin_url('admin.php?page=a2wf-siteai-manager&tab=preview')); ?>" class="nav-tab <?php echo esc_attr('preview' === $tab ? 'nav-tab-active' : ''); ?>">Preview</a>
            </nav>

            <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" class="a2wf-form">
                <input type="hidden" name="action" value="a2wf_siteai_save" />
                <?php wp_nonce_field('a2wf_siteai_save'); ?>

                <?php if ('core' === $tab) : ?>
                    <?php $this->render_core_tab($settings['core']); ?>
                <?php elseif ('extensions' === $tab) : ?>
                    <?php $this->render_extensions_tab($settings['extensions']); ?>
                <?php else : ?>
                    <?php $this->render_preview_tab($json); ?>
                <?php endif; ?>

                <?php if ('preview' !== $tab) : ?>
                    <p class="submit">
                        <button type="submit" class="button button-primary button-large">Speichern</button>
                    </p>
                <?php endif; ?>
            </form>
        </div>
        <?php
    }

    private function render_core_tab($core) {
        ?>
        <div class="a2wf-grid">
            <div class="a2wf-card">
                <h2>Identity</h2>
                <?php $this->text('a2wf[core][identity][domain]', 'Domain', $core['identity']['domain'], 'url'); ?>
                <?php $this->text('a2wf[core][identity][name]', 'Name', $core['identity']['name']); ?>
                <?php $this->textarea('a2wf[core][identity][description]', 'Description', $core['identity']['description']); ?>
                <?php $this->textarea('a2wf[core][identity][purpose]', 'Purpose', $core['identity']['purpose']); ?>
                <?php $this->text('a2wf[core][identity][inLanguage]', 'Language (BCP 47)', $core['identity']['inLanguage']); ?>
                <?php $this->text('a2wf[core][identity][category]', 'Category', $core['identity']['category']); ?>
                <?php $this->text('a2wf[core][identity][jurisdiction]', 'Jurisdiction', $core['identity']['jurisdiction']); ?>
                <?php $this->text('a2wf[core][identity][contact]', 'Contact Email', $core['identity']['contact'], 'email'); ?>
                <?php $this->textarea('a2wf[core][identity][applicableLaw]', 'Applicable Law (eine Zeile pro Eintrag)', implode("\n", $core['identity']['applicableLaw'])); ?>
            </div>

            <div class="a2wf-card">
                <h2>Defaults</h2>
                <?php $this->text('a2wf[core][defaults][agentAccess]', 'Agent Access', $core['defaults']['agentAccess']); ?>
                <?php $this->checkbox('a2wf[core][defaults][requireIdentification]', 'Require Identification', $core['defaults']['requireIdentification']); ?>
                <?php $this->checkbox('a2wf[core][defaults][humanVerificationRequired]', 'Human Verification Required', $core['defaults']['humanVerificationRequired']); ?>
                <?php $this->number('a2wf[core][defaults][maxRequestsPerMinute]', 'Max Requests / Minute', $core['defaults']['maxRequestsPerMinute']); ?>
                <?php $this->number('a2wf[core][defaults][maxRequestsPerHour]', 'Max Requests / Hour', $core['defaults']['maxRequestsPerHour']); ?>
                <?php $this->checkbox('a2wf[core][defaults][respectRobotsTxt]', 'Respect robots.txt', $core['defaults']['respectRobotsTxt']); ?>
            </div>
        </div>

        <div class="a2wf-card a2wf-card-full">
            <h2>Permissions</h2>
            <p class="description">Core bleibt strikt governance-zentriert: Read, Action und Data getrennt pflegen.</p>
            <?php foreach ($this->permission_labels as $group => $labels) : ?>
                <h3><?php echo esc_html(ucfirst($group)); ?></h3>
                <table class="widefat striped a2wf-permissions-table">
                    <thead>
                        <tr>
                            <th>Permission</th>
                            <th>Allowed</th>
                            <th>Rate Limit</th>
                            <th>Human Verification</th>
                            <th>Note</th>
                        </tr>
                    </thead>
                    <tbody>
                    <?php foreach ($labels as $key => $label) : $row = $core['permissions'][$group][$key]; ?>
                        <tr>
                            <td><strong><?php echo esc_html($label); ?></strong><br><code><?php echo esc_html($key); ?></code></td>
                            <td><input type="checkbox" name="a2wf[core][permissions][<?php echo esc_attr($group); ?>][<?php echo esc_attr($key); ?>][allowed]" value="1" <?php checked($row['allowed']); ?>></td>
                            <td><input type="number" min="0" name="a2wf[core][permissions][<?php echo esc_attr($group); ?>][<?php echo esc_attr($key); ?>][rateLimit]" value="<?php echo esc_attr($row['rateLimit']); ?>"></td>
                            <td><input type="checkbox" name="a2wf[core][permissions][<?php echo esc_attr($group); ?>][<?php echo esc_attr($key); ?>][humanVerification]" value="1" <?php checked($row['humanVerification']); ?>></td>
                            <td><input type="text" class="regular-text" name="a2wf[core][permissions][<?php echo esc_attr($group); ?>][<?php echo esc_attr($key); ?>][note]" value="<?php echo esc_attr($row['note']); ?>"></td>
                        </tr>
                    <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endforeach; ?>
        </div>

        <div class="a2wf-grid">
            <div class="a2wf-card">
                <h2>Agent Identification</h2>
                <?php $this->checkbox('a2wf[core][agentIdentification][requireUserAgent]', 'Require User-Agent', $core['agentIdentification']['requireUserAgent']); ?>
                <?php $this->checkbox('a2wf[core][agentIdentification][allowAnonymousAgents]', 'Allow Anonymous Agents', $core['agentIdentification']['allowAnonymousAgents']); ?>
                <?php $this->textarea('a2wf[core][agentIdentification][requiredFields]', 'Required Fields (eine Zeile pro Eintrag)', implode("\n", $core['agentIdentification']['requiredFields'])); ?>
                <?php $this->textarea('a2wf[core][agentIdentification][trustedAgents]', 'Trusted Agents (JSON)', $core['agentIdentification']['trustedAgents'], 8, 'Beispiel: [{"name":"Agent","operator":"Vendor","permissions":["search"]}]'); ?>
                <?php $this->textarea('a2wf[core][agentIdentification][blockedAgents]', 'Blocked Agents (JSON)', $core['agentIdentification']['blockedAgents'], 8, 'Beispiel: [{"pattern":"BadBot","reason":"Policy violation"}]'); ?>
            </div>

            <div class="a2wf-card">
                <h2>Scraping</h2>
                <?php foreach (array('bulkDataExtraction', 'priceMonitoring', 'contentReproduction', 'competitiveAnalysis', 'trainingDataUsage') as $flag) : ?>
                    <?php $this->checkbox('a2wf[core][scraping][' . $flag . ']', $flag, $core['scraping'][$flag]); ?>
                <?php endforeach; ?>
                <?php $this->textarea('a2wf[core][scraping][note]', 'Note', $core['scraping']['note']); ?>
            </div>
        </div>

        <div class="a2wf-grid">
            <div class="a2wf-card">
                <h2>Human Verification</h2>
                <?php $this->textarea('a2wf[core][humanVerification][methods]', 'Methods (eine Zeile pro Eintrag)', implode("\n", $core['humanVerification']['methods'])); ?>
                <?php $this->textarea('a2wf[core][humanVerification][requiredFor]', 'Required For (eine Zeile pro Action-Key)', implode("\n", $core['humanVerification']['requiredFor'])); ?>
                <?php $this->textarea('a2wf[core][humanVerification][note]', 'Note', $core['humanVerification']['note']); ?>
            </div>

            <div class="a2wf-card">
                <h2>Legal, Discovery & Metadata</h2>
                <?php $this->text('a2wf[core][legal][termsUrl]', 'Terms URL', $core['legal']['termsUrl'], 'url'); ?>
                <?php $this->textarea('a2wf[core][legal][complianceNote]', 'Compliance Note', $core['legal']['complianceNote']); ?>
                <?php $this->text('a2wf[core][legal][dataRetention]', 'Data Retention', $core['legal']['dataRetention']); ?>
                <?php $this->checkbox('a2wf[core][legal][euAiActCompliance][transparencyRequired]', 'EU AI Act: Transparency Required', $core['legal']['euAiActCompliance']['transparencyRequired']); ?>
                <?php $this->text('a2wf[core][legal][euAiActCompliance][riskClassification]', 'EU AI Act: Risk Classification', $core['legal']['euAiActCompliance']['riskClassification']); ?>
                <?php $this->checkbox('a2wf[core][legal][euAiActCompliance][humanOversightMandatory]', 'EU AI Act: Human Oversight Mandatory', $core['legal']['euAiActCompliance']['humanOversightMandatory']); ?>

                <hr>
                <?php $this->text('a2wf[core][discovery][robotsTxt]', 'robots.txt', $core['discovery']['robotsTxt'], 'url'); ?>
                <?php $this->text('a2wf[core][discovery][llmsTxt]', 'llms.txt', $core['discovery']['llmsTxt'], 'url'); ?>
                <?php $this->text('a2wf[core][discovery][mcpEndpoint]', 'MCP Endpoint', $core['discovery']['mcpEndpoint'], 'url'); ?>
                <?php $this->text('a2wf[core][discovery][a2aAgentCard]', 'A2A Agent Card', $core['discovery']['a2aAgentCard'], 'url'); ?>
                <?php $this->text('a2wf[core][discovery][openApi]', 'OpenAPI', $core['discovery']['openApi'], 'url'); ?>
                <?php $this->checkbox('a2wf[core][discovery][schemaOrg]', 'Schema.org available', $core['discovery']['schemaOrg']); ?>

                <hr>
                <?php $this->text('a2wf[core][metadata][author]', 'Metadata Author', $core['metadata']['author']); ?>
                <?php $this->text('a2wf[core][metadata][lastUpdated]', 'Last Updated', $core['metadata']['lastUpdated']); ?>
                <?php $this->text('a2wf[core][metadata][expiresAt]', 'Expires At', $core['metadata']['expiresAt']); ?>
                <?php $this->text('a2wf[core][metadata][changelogUrl]', 'Changelog URL', $core['metadata']['changelogUrl'], 'url'); ?>
            </div>
        </div>
        <?php
    }

    private function render_extensions_tab($extensions) {
        $fields = array(
            'keySections' => 'Key Sections (JSON array)',
            'mainContact' => 'Main Contact (JSON object)',
            'publisher' => 'Publisher (JSON object)',
            'company' => 'Company (JSON object)',
            'services' => 'Services (JSON array)',
            'forms' => 'Forms (JSON array)',
            'apiEndpoints' => 'API Endpoints (JSON array)',
            'search' => 'Search (JSON object)',
            'faq' => 'FAQ (JSON object)',
            'navigation' => 'Navigation (JSON object)',
            'ecommerce' => 'Ecommerce (JSON object)',
            'media' => 'Media (JSON object)',
            'careers' => 'Careers (JSON object)',
            'innovations' => 'Innovations (JSON object)',
            'securityDefinitions' => 'Security Definitions (JSON object)',
            'alternateVersions' => 'Alternate Versions (JSON array)',
        );
        ?>
        <div class="a2wf-card a2wf-card-full">
            <h2>Extensions</h2>
            <p class="description">Extensions bleiben bewusst getrennt von Governance. So wird die Core-Spec nicht mit beschreibenden Site-Capabilities vermischt.</p>
            <p class="description">Nur valides JSON wird gespeichert. Ungültige Blöcke werden beim Speichern verworfen und als Hinweis gemeldet.</p>
            <?php $this->checkbox('a2wf[extensions][enabled]', 'Extensions in siteai.json ausgeben', $extensions['enabled']); ?>
            <?php foreach ($fields as $key => $label) : ?>
                <?php $this->textarea('a2wf[extensions][' . $key . ']', $label, $extensions[$key], 8); ?>
            <?php endforeach; ?>
        </div>
        <?php
    }

    private function render_preview_tab($json) {
        ?>
        <div class="a2wf-grid">
            <div class="a2wf-card">
                <h2>Preview</h2>
                <p class="description">Die Preview zeigt die aktuell gespeicherte Konfiguration inklusive aktivierter Extensions.</p>
                <textarea readonly id="a2wf-json-preview" class="large-text code" rows="34"><?php echo esc_textarea($json); ?></textarea>
            </div>
            <div class="a2wf-card">
                <h2>Deployment-Hinweise</h2>
                <ol>
                    <li>Plugin aktivieren und Permalinks einmal neu speichern oder aktivieren lassen.</li>
                    <li>Danach ist die Datei unter <code><?php echo esc_html(home_url('/siteai.json')); ?></code> erreichbar.</li>
                    <li>Optional <code>SiteAI: <?php echo esc_html(home_url('/siteai.json')); ?></code> in <code>robots.txt</code> ergänzen.</li>
                    <li>Extensions nur aktivieren, wenn die Daten wirklich gepflegt werden.</li>
                </ol>
            </div>
        </div>
        <?php
    }

    private function text($name, $label, $value, $type = 'text') {
        printf(
            '<p><label><strong>%s</strong><br><input type="%s" class="regular-text" name="%s" value="%s" spellcheck="false" autocomplete="off"></label></p>',
            esc_html($label),
            esc_attr($type),
            esc_attr($name),
            esc_attr($value)
        );
    }

    private function number($name, $label, $value) {
        printf(
            '<p><label><strong>%s</strong><br><input type="number" min="0" class="small-text" name="%s" value="%s"></label></p>',
            esc_html($label),
            esc_attr($name),
            esc_attr($value)
        );
    }

    private function textarea($name, $label, $value, $rows = 4, $hint = '') {
        echo '<p><label><strong>' . esc_html($label) . '</strong>';

        if ($hint) {
            echo '<br><span class="description">' . esc_html($hint) . '</span>';
        }

        echo '<br><textarea class="large-text code" rows="' . esc_attr($rows) . '" name="' . esc_attr($name) . '" spellcheck="false">' . esc_textarea($value) . '</textarea></label></p>';
    }

    private function checkbox($name, $label, $checked) {
        printf(
            '<p><label><input type="checkbox" name="%s" value="1" %s> %s</label></p>',
            esc_attr($name),
            checked($checked, true, false),
            esc_html($label)
        );
    }

    private function normalize_notice_type($type) {
        $allowed = array('success', 'warning', 'error', 'info');

        return in_array($type, $allowed, true) ? $type : 'info';
    }
}
