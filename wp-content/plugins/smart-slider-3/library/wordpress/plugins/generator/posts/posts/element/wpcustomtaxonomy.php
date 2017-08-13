<?php

N2Loader::import('libraries.form.element.list');

class N2ElementWPCustomTaxonomy extends N2ElementList
{

    function fetchElement() {
        $taxonomies = get_taxonomies();
        unset($taxonomies['category']);
        unset($taxonomies['nav_menu']);
        unset($taxonomies['link_category']);
        unset($taxonomies['post_format']);
        unset($taxonomies['post_tag']);
        $terms = array();
        $term_helper = array();

        foreach ($taxonomies as $taxonomy) {
            $term_helper[$taxonomy] = get_terms(array(
                'taxonomy' => $taxonomy/*,
                'hide_empty' => false,*/
            ));
        }

        $this->_xml->addChild('option', 'All')
                   ->addAttribute('value', 0);
        if (count($term_helper)) {
            foreach ($term_helper as $taxonomy_name => $terms) {
                $taxonomy = get_taxonomy($taxonomy_name);
                if(count($terms)){
                    foreach ($terms AS $term) {
                        $this->_xml->addChild('option', htmlspecialchars('- ' . $term->name . " [".$taxonomy->label."]"))
                                   ->addAttribute('value', $taxonomy->name."_x_".$term->term_id);
                    }
                }
            }
        }

        return parent::fetchElement();
    }

}
