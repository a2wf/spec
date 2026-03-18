<?php
/**
 * Plugin Name: A2WF SiteAI Manager
 * Description: Erstellt, bearbeitet und veröffentlicht siteai.json für A2WF Core und optionale Extensions direkt in WordPress.
 * Version: 0.1.0
 * Author: A2WF Prototype
 * License: GPL-2.0-or-later
 * Text Domain: a2wf-siteai-manager
 */

if (! defined('ABSPATH')) {
    exit;
}

if (! defined('A2WF_SITEAI_MANAGER_VERSION')) {
    define('A2WF_SITEAI_MANAGER_VERSION', '0.1.0');
}

if (! defined('A2WF_SITEAI_MANAGER_FILE')) {
    define('A2WF_SITEAI_MANAGER_FILE', __FILE__);
}

if (! defined('A2WF_SITEAI_MANAGER_DIR')) {
    define('A2WF_SITEAI_MANAGER_DIR', plugin_dir_path(__FILE__));
}

if (! defined('A2WF_SITEAI_MANAGER_URL')) {
    define('A2WF_SITEAI_MANAGER_URL', plugin_dir_url(__FILE__));
}

require_once A2WF_SITEAI_MANAGER_DIR . 'includes/class-a2wf-siteai-manager-plugin.php';

function a2wf_siteai_manager() {
    return A2WF_SiteAI_Manager_Plugin::instance();
}

a2wf_siteai_manager();
