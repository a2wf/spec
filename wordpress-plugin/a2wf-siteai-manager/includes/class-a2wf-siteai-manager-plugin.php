<?php

if (! defined('ABSPATH')) {
    exit;
}

require_once A2WF_SITEAI_MANAGER_DIR . 'includes/class-a2wf-siteai-manager-settings.php';
require_once A2WF_SITEAI_MANAGER_DIR . 'includes/class-a2wf-siteai-manager-generator.php';
require_once A2WF_SITEAI_MANAGER_DIR . 'includes/class-a2wf-siteai-manager-admin.php';
require_once A2WF_SITEAI_MANAGER_DIR . 'includes/class-a2wf-siteai-manager-endpoint.php';

class A2WF_SiteAI_Manager_Plugin {
    private static $instance = null;

    public $settings;
    public $generator;
    public $admin;
    public $endpoint;

    public static function instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    private function __construct() {
        $this->settings  = new A2WF_SiteAI_Manager_Settings();
        $this->generator = new A2WF_SiteAI_Manager_Generator($this->settings);
        $this->admin     = new A2WF_SiteAI_Manager_Admin($this->settings, $this->generator);
        $this->endpoint  = new A2WF_SiteAI_Manager_Endpoint($this->generator);

        add_action('init', array($this, 'init'));
        register_activation_hook(A2WF_SITEAI_MANAGER_FILE, array(__CLASS__, 'activate'));
        register_deactivation_hook(A2WF_SITEAI_MANAGER_FILE, array(__CLASS__, 'deactivate'));
    }

    public function init() {
        load_plugin_textdomain('a2wf-siteai-manager', false, dirname(plugin_basename(A2WF_SITEAI_MANAGER_FILE)) . '/languages');
    }

    public static function activate() {
        $endpoint = new A2WF_SiteAI_Manager_Endpoint(new A2WF_SiteAI_Manager_Generator(new A2WF_SiteAI_Manager_Settings()));
        $endpoint->register_rewrite();
        flush_rewrite_rules();
    }

    public static function deactivate() {
        flush_rewrite_rules();
    }
}
