<?php

if (! defined('ABSPATH')) {
    exit;
}

class A2WF_SiteAI_Manager_Endpoint {
    private $generator;
    const QUERY_VAR = 'a2wf_siteai_json';

    public function __construct($generator) {
        $this->generator = $generator;
        add_action('init', array($this, 'register_rewrite'));
        add_filter('query_vars', array($this, 'register_query_var'));
        add_action('template_redirect', array($this, 'maybe_render_json'));
    }

    public function register_rewrite() {
        add_rewrite_rule('^siteai\.json$', 'index.php?' . self::QUERY_VAR . '=1', 'top');
    }

    public function register_query_var($vars) {
        $vars[] = self::QUERY_VAR;
        return $vars;
    }

    public function maybe_render_json() {
        if (! get_query_var(self::QUERY_VAR)) {
            return;
        }

        nocache_headers();
        header('Content-Type: application/json; charset=' . get_bloginfo('charset'));
        echo $this->generator->get_pretty_json();
        exit;
    }
}
